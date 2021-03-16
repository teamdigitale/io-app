import { call, Effect, put } from "redux-saga/effects";
import { Millisecond } from "italia-ts-commons/lib/units";
import { Either, left, right } from "fp-ts/lib/Either";
import { SagaCallReturnType } from "../../../../../../../types/utils";
import { BackendCGN } from "../../../../api/backendCgn";
import { startTimer } from "../../../../../../../utils/timer";
import { readablePrivacyReport } from "../../../../../../../utils/reporters";
import {
  getGenericError,
  getNetworkError,
  NetworkError
} from "../../../../../../../utils/errors";
import { StatusEnum } from "../../../../../../../../definitions/cgn/EycaActivationDetail";
import { cgnEycaActivation } from "../../../../store/actions/eyca/activation";

// wait time between requests
const cgnResultPolling = 1000 as Millisecond;
// stop polling when elapsed time from the beginning exceeds this threshold
const pollingTimeThreshold = (10 * 1000) as Millisecond;

type StartEycaStatus = "INELIGIBLE" | "ALREADY_ACTIVE" | "PROCESSING";
const mapStatus: Map<number, StartEycaStatus> = new Map([
  [201, "PROCESSING"],
  [202, "PROCESSING"],
  [403, "INELIGIBLE"],
  [409, "ALREADY_ACTIVE"]
]);

/**
 * ask for starting activation of EYCA card
 * @param startEycaActivation
 */
function* handleStartActivation(
  startEycaActivation: ReturnType<typeof BackendCGN>["startEycaActivation"]
): Generator<Effect, Either<NetworkError, StartEycaStatus>, any> {
  try {
    const startEycaActivationResult: SagaCallReturnType<typeof startEycaActivation> = yield call(
      startEycaActivation,
      {}
    );
    if (startEycaActivationResult.isRight()) {
      const status = startEycaActivationResult.value.status;
      const activationStatus = mapStatus.get(status);
      if (activationStatus) {
        return right(activationStatus);
      }
      throw Error(`response status ${startEycaActivationResult.value.status}`);
    }
    // decoding failure
    throw Error(readablePrivacyReport(startEycaActivationResult.value));
  } catch (e) {
    return left(getNetworkError(e));
  }
}

type GetEycaStatus = "COMPLETED" | "PROCESSING" | "ERROR" | "NOT_FOUND";
/**
 * ask for the current status of EYCA activation
 * it returns the status {@link GetEycaStatus} - right case
 * if an error occured it returns a {@link NetworkError} - left case
 * @param getEycaActivation
 */
function* getActivation(
  getEycaActivation: ReturnType<typeof BackendCGN>["getEycaActivation"]
): Generator<Effect, Either<NetworkError, GetEycaStatus>, any> {
  try {
    const getEycaActivationResult: SagaCallReturnType<typeof getEycaActivation> = yield call(
      getEycaActivation,
      {}
    );
    if (getEycaActivationResult.isRight()) {
      if (getEycaActivationResult.value.status === 200) {
        const result = getEycaActivationResult.value.value;
        switch (result.status) {
          case StatusEnum.COMPLETED:
            return right("COMPLETED");
          case StatusEnum.ERROR:
            return right("ERROR");
          case StatusEnum.PENDING:
          case StatusEnum.RUNNING:
            return right("PROCESSING");
          default:
            const reason = `unexpected status result ${getEycaActivationResult.value.value.status}`;
            return left(getGenericError(new Error(reason)));
        }
      } else if (getEycaActivationResult.value.status === 404) {
        return right("NOT_FOUND");
      } else {
        return left(
          getGenericError(
            new Error(`response status ${getEycaActivationResult.value.status}`)
          )
        );
      }
    } else {
      // decoding failure
      return left(
        getGenericError(
          new Error(readablePrivacyReport(getEycaActivationResult.value))
        )
      );
    }
  } catch (e) {
    return left(getNetworkError(e));
  }
}

/**
 * Function that handles the activation of EYCA card
 * see https://www.pivotaltracker.com/story/show/177062719/comments/222747527
 * first it checks for the status activation
 * depending on that, it could start a polling to wait about completion or ends with a defined state
 * @param getEycaActivation asks for the status of EYCA card activation
 * @param startEycaActivation asks for the activation of EYCA card
 */
export function* handleEycaActivationSaga(
  getEycaActivation: ReturnType<typeof BackendCGN>["getEycaActivation"],
  startEycaActivation: ReturnType<typeof BackendCGN>["startEycaActivation"]
) {
  const startPollingTime = new Date().getTime();
  while (true) {
    const activationInfo: SagaCallReturnType<typeof getActivation> = yield call(
      getActivation,
      getEycaActivation
    );
    if (activationInfo.isLeft()) {
      yield put(cgnEycaActivation.failure(activationInfo.value));
      return;
    }
    const status: GetEycaStatus = activationInfo.value;
    switch (status) {
      case "COMPLETED":
        yield put(cgnEycaActivation.success("COMPLETED"));
        return;
      case "NOT_FOUND":
        // ask for activation
        const startActivation = yield call(
          handleStartActivation,
          startEycaActivation
        );
        // activation not handled error, stop
        if (startActivation.isLeft()) {
          yield put(cgnEycaActivation.failure(startActivation.value));
          return;
        } else {
          const startActivationStatus: StartEycaStatus = startActivation.value;
          // could be: ALREADY_ACTIVE, INELIGIBLE
          if (startActivationStatus !== "PROCESSING") {
            yield put(cgnEycaActivation.success(startActivation.value));
            return;
          }
        }
        break;
      case "ERROR":
        // activation logic error
        yield put(cgnEycaActivation.success("ERROR"));
        return;
    }
    yield put(cgnEycaActivation.success("POLLING"));
    // sleep
    yield call(startTimer, cgnResultPolling);
    const now = new Date().getTime();
    // stop polling if threshold is exceeded
    if (now - startPollingTime >= pollingTimeThreshold) {
      yield put(cgnEycaActivation.success("POLLING_TIMEOUT"));
      return;
    }
  }
}
