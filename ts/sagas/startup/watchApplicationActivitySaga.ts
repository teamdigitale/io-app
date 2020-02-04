import { Effect, Task } from "redux-saga";
import { call, cancel, fork, put, select, takeEvery } from "redux-saga/effects";
import { ActionType, getType } from "typesafe-actions";
import { backgroundActivityTimeout } from "../../config";
import ROUTES from "../../navigation/routes";
import {
  applicationChangeState,
  ApplicationState
} from "../../store/actions/application";
import { identificationRequest } from "../../store/actions/identification";
import { navSelector } from "../../store/reducers/navigationHistory";
import { getCurrentRouteName } from "../../utils/navigation";
import { startTimer } from "../../utils/timer";
import { watchNotificationSaga } from "./watchNotificationSaga";

/**
 * Listen to APP_STATE_CHANGE_ACTION and:
 * - if needed, force the user to identify
 * - if a notification is pressed, redirect to the related message
 */
export function* watchApplicationActivitySaga(): IterableIterator<Effect> {
  // tslint:disable-next-line:no-let
  let lastState: ApplicationState = "active";

  yield takeEvery(getType(applicationChangeState), function*(
    action: ActionType<typeof applicationChangeState>
  ) {
    // Listen for changes in application state
    const newApplicationState: ApplicationState = action.payload;

    yield fork(watchRequiredIdentificationSaga, lastState, newApplicationState);

    yield fork(watchNotificationSaga, lastState, newApplicationState);

    // Update the last state
    lastState = newApplicationState;
  });
}

/**
 * When the app goes in background and return active, the identification is asked if:
 * - the current route requires the identification be be shown again
 * - it is passed a certain amount of time
 * @param lastState previous application state
 * @param newState  current application state
 */
export function* watchRequiredIdentificationSaga(
  lastState: ApplicationState,
  newState: ApplicationState
) {
  // Screens requiring identification when the app pass from background/inactive to active state
  const whiteList: ReadonlyArray<string> = [ROUTES.WALLET_ADD_CARD];

  const nav: ReturnType<typeof navSelector> = yield select(navSelector);
  const currentRoute = getCurrentRouteName(nav);
  const isSecuredRoute = currentRoute && whiteList.indexOf(currentRoute) !== -1;

  const backgroundActivityTimeoutMillis = backgroundActivityTimeout * 1000;
  // tslint:disable-next-line:no-let
  let identificationBackgroundTimer: Task | undefined;

  if (lastState !== "background" && newState === "background") {
    if (isSecuredRoute) {
      /**
       * Request always identification to display again screens included in the witheList.
       * It is done on status change from active/inactive to background to avoid secured
       * screen being displayed for a while before the IdentificationScreen when the user
       * focuses again on the app
       */
      yield put(identificationRequest());
    } else {
      // Start the background timer
      identificationBackgroundTimer = yield fork(function*() {
        // Start and wait the timer to fire
        yield call(startTimer, backgroundActivityTimeoutMillis);
        identificationBackgroundTimer = undefined;
        // Timer fired we need to identify the user again
        yield put(identificationRequest());
      });
    }
  } else if (lastState !== "active" && newState === "active") {
    if (identificationBackgroundTimer) {
      // Cancel the background timer if running
      yield cancel(identificationBackgroundTimer);
      identificationBackgroundTimer = undefined;
    }

    // for iOS - if the app pass trought the states: active > inactive > active
    if (lastState === "inactive" && isSecuredRoute) {
      yield put(identificationRequest());
    }
  }
}
