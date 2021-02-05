import { readableReport } from "italia-ts-commons/lib/reporters";
import { call, Effect, fork, put, take, takeLatest } from "redux-saga/effects";
import { ActionType, getType } from "typesafe-actions";
import { buffers, channel, Channel } from "redux-saga";
import { Millisecond } from "italia-ts-commons/lib/units";
import { BackendClient } from "../../api/backend";
import {
  loadServiceDetail,
  loadServicesDetail
} from "../../store/actions/services";
import { SagaCallReturnType } from "../../types/utils";
import { handleOrganizationNameUpdateSaga } from "../services/handleOrganizationNameUpdateSaga";
import { handleServiceReadabilitySaga } from "../services/handleServiceReadabilitySaga";
import { totServiceFetchWorkers } from "../../config";
import { applicationChangeState } from "../../store/actions/application";
import { mixpanelTrack } from "../../mixpanel";

/**
 * A generator to load the service details from the Backend
 *
 * @param {function} getService - The function that makes the Backend request
 * @param action
 * @returns {IterableIterator<Effect | Either<Error, ServicePublic>>}
 */
export function* loadServiceDetailRequestHandler(
  getService: ReturnType<typeof BackendClient>["getService"],
  action: ActionType<typeof loadServiceDetail["request"]>
): Generator<Effect, void, SagaCallReturnType<typeof getService>> {
  try {
    const response = yield call(getService, { service_id: action.payload });

    if (response.isLeft()) {
      throw Error(readableReport(response.value));
    }

    if (response.value.status === 200) {
      yield put(loadServiceDetail.success(response.value.value));

      // If it is occurring during the first load of serivces,
      // mark the service as read (it will not display the badge on the list item)
      yield call(handleServiceReadabilitySaga, action.payload);

      // Update, if needed, the name of the organization that provides the service
      yield call(handleOrganizationNameUpdateSaga, response.value.value);
    } else {
      throw Error(`response status ${response.value.status}`);
    }
  } catch (error) {
    yield put(loadServiceDetail.failure({ service_id: action.payload, error }));
  }
}

/**
 * A generator that listen for loadServiceDetail.request from a channel and perform the
 * handling.
 *
 * @param requestsChannel The channel where to take the loadServiceDetail.request actions
 * @param getService API call to fetch the service detail
 */
function* handleServiceLoadRequest(
  requestsChannel: Channel<ActionType<typeof loadServiceDetail.request>>,
  getService: ReturnType<typeof BackendClient>["getService"]
) {
  // Infinite loop that wait and process loadServiceDetail requests from the channel
  while (true) {
    const action: ActionType<typeof loadServiceDetail.request> = yield take(
      requestsChannel
    );
    yield call(loadServiceDetailRequestHandler, getService, action);
  }
}

/**
 * create an event channel to buffer all services detail loading requests
 * it watches for loadServicesDetail (multiple services id) and for each of them, it puts a
 * loadServiceDetail.request event into that channel
 * The workers (the handlers) will consume the channel data
 * @param getService
 */
export function* watchServicesDetailLoadSaga(
  getService: ReturnType<typeof BackendClient>["getService"]
) {
  // start a saga to track services detail load stats
  yield fork(watchLoadServicesDetailToTrack);

  // Create the channel used for the communication with the handlers.
  const requestsChannel: Channel<ActionType<
    typeof loadServiceDetail.request
  >> = yield call(channel, buffers.expanding());

  // fork the handlers
  // eslint-disable-next-line
  for (let i = 0; i < totServiceFetchWorkers; i++) {
    yield fork(handleServiceLoadRequest, requestsChannel, getService);
  }

  while (true) {
    // Take the loadServicesDetail action and for each service id
    // put back a loadServiceDetail.request in the channel
    // to be processed by the handlers.
    const action: ActionType<typeof loadServicesDetail> = yield take(
      getType(loadServicesDetail)
    );
    action.payload.forEach((serviceId: string) =>
      requestsChannel.put(loadServiceDetail.request(serviceId))
    );
  }
}

/**
 * listen for services detail loading event to extract some track information
 * like amount of detail to load and how much time they take
 */
function* watchLoadServicesDetailToTrack() {
  yield takeLatest(
    [loadServicesDetail, loadServiceDetail.success, applicationChangeState],
    action => {
      switch (action.type) {
        // request to load a set of services detail
        // copying object is needed to avoid "immutable" error on frozen objects
        case getType(loadServicesDetail):
          const stats: ServicesDetailLoadTrack = {
            ...servicesDetailLoadTrack,
            kind: undefined,
            startTime: new Date().getTime() as Millisecond,
            servicesId: new Set([...action.payload]),
            loaded: 0,
            toLoad: servicesDetailLoadTrack.servicesId.size
          };
          servicesDetailLoadTrack = stats;
          break;
        // single service detail is been loaded
        case getType(loadServiceDetail.success):
          servicesDetailLoadTrack.servicesId.delete(action.payload.service_id);
          const statsServiceLoad: ServicesDetailLoadTrack = {
            ...servicesDetailLoadTrack,
            loaded:
              servicesDetailLoadTrack.toLoad -
              servicesDetailLoadTrack.servicesId.size
          };
          servicesDetailLoadTrack = statsServiceLoad;
          if (statsServiceLoad.servicesId.size === 0) {
            // all service are been loaded
            trackServicesDetailLoad({
              ...servicesDetailLoadTrack,
              kind: "COMPLETE",
              loadingTime: (new Date().getTime() -
                servicesDetailLoadTrack.startTime) as Millisecond
            });
          }

          break;
        // app changes state
        case getType(applicationChangeState):
          /**
           * if the app went in inactive or background state these measurements
           * could be not valid since the OS could apply a freeze or a limitation around the app context
           * so the app could run but with few limitations
           */
          if (action.payload !== "active") {
            trackServicesDetailLoad({
              ...servicesDetailLoadTrack,
              loadingTime: (new Date().getTime() -
                servicesDetailLoadTrack.startTime) as Millisecond,
              kind: "PARTIAL"
            });
          }
          // app comes back active, restore stats
          else if (action.payload === "active") {
            servicesDetailLoadTrack = {
              ...servicesDetailLoadTrack,
              kind: undefined,
              startTime: new Date().getTime() as Millisecond,
              loaded: 0,
              toLoad: servicesDetailLoadTrack.servicesId.size
            };
          }
          break;
      }
    }
  );
}

type ServicesDetailLoadTrack = {
  // when loading starts
  startTime: Millisecond;
  // the amount of loading millis
  loadingTime: Millisecond;
  // the amount of services detail to load
  toLoad: number;
  // the amount of services detail loaded
  loaded: number;
  // the set of the services id that remain to be loaded
  servicesId: Set<string>;
  // COMPLETE: all services detail are been loaded
  // PARTIAL: a sub-set of services detail to load are been loaded
  kind?: "COMPLETE" | "PARTIAL";
};
// eslint-disable-next-line functional/no-let
let servicesDetailLoadTrack: ServicesDetailLoadTrack = {
  startTime: 0 as Millisecond,
  loadingTime: 0 as Millisecond,
  toLoad: 0,
  loaded: 0,
  servicesId: new Set<string>()
};

const trackServicesDetailLoad = (trackingStats: ServicesDetailLoadTrack) => {
  void mixpanelTrack("SERVICES_DETAIL_LOADING_STATS", {
    serviceLoadingStats: {
      ...trackingStats,
      // drop servicesId since it is not serialized in mixpanel and it could be an extra overhead in sending
      servicesId: undefined
    }
  });
};
