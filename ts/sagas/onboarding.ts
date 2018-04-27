/**
 * A saga that manages the Onboarding.
 *
 * For a detailed view of the flow check @https://docs.google.com/document/d/1le-IdjcGWtmfrMzh6d_qTwsnhVNCExbCd6Pt4gX7VGo/edit
 */

import { takeLatest, fork, take, select, put, call, Effect } from 'redux-saga/effects'
import { NavigationActions } from 'react-navigation'

import { PinCreateRequest } from '../store/actions/onboarding'
import {
  SESSION_INITIALIZE_SUCCESS,
  ONBOARDING_CHECK_TOS,
  ONBOARDING_CHECK_PIN,
  ONBOARDING_CHECK_COMPLETE,
  TOS_ACCEPT_REQUEST,
  TOS_ACCEPT_SUCCESS,
  PIN_CREATE_REQUEST,
  PIN_CREATE_SUCCESS,
  PIN_CREATE_FAILURE
} from '../store/actions/constants'
import ROUTES from '../navigation/routes'
import {
  isTosAcceptedSelector,
  isPinCreatedSelector,
} from '../store/reducers/onboarding'
import { setPin } from '../utils/keychain'

/**
 * The PIN step of the Onboarding
 */
function* pinCheckSaga(): Iterator<Effect> {
  yield take(ONBOARDING_CHECK_PIN)

  // From the state we check whether the user has already created a PIN
  const isPinCreated: boolean = yield select(isPinCreatedSelector)

  if (!isPinCreated) {
    // Navigate to the PinScreen
    const navigateToOnboardingPinScreenAction = NavigationActions.reset({
      index: 0,
      actions: [
        NavigationActions.navigate({ routeName: ROUTES.ONBOARDING_PIN })
      ],
      key: ROUTES.ONBOARDING
    })
    yield put(navigateToOnboardingPinScreenAction)

    let isPinSaved = false

    // Loop until PIN successfully saved in the Keystore
    while (!isPinSaved) {
      // Here we wait the user to create a PIN
      const action: PinCreateRequest = yield take(PIN_CREATE_REQUEST)

      try {
        yield call(setPin, action.payload)

        // Dispatch the action that sets isPinCreated to true into the store
        yield put({
          type: PIN_CREATE_SUCCESS
        })

        isPinSaved = true
      } catch (error) {
        yield put({
          type: PIN_CREATE_FAILURE
        })
      }
    }
  }

  // Dispatch an action to start the next step
  yield put({
    type: ONBOARDING_CHECK_COMPLETE
  })
}

/**
 * The ToS step of the Onboarding
 */
function* tosCheckSaga(): Iterator<Effect> {
  yield take(ONBOARDING_CHECK_TOS)

  // From the state we check whether the user has already accepted the ToS
  const isTosAccepted: boolean = yield select(isTosAcceptedSelector)

  if (!isTosAccepted) {
    // Navigate to the TosScreen
    const navigateToOnboardingTosScreenAction = NavigationActions.reset({
      index: 0,
      actions: [
        NavigationActions.navigate({ routeName: ROUTES.ONBOARDING_TOS })
      ],
      key: ROUTES.ONBOARDING
    })
    yield put(navigateToOnboardingTosScreenAction)

    // Here we wait the user accept the ToS
    yield take(TOS_ACCEPT_REQUEST)

    // Dispatch the action that sets isTosAccepted to true into the store
    yield put({
      type: TOS_ACCEPT_SUCCESS
    })
  }

  // Dispatch an action to start the next step
  yield put({
    type: ONBOARDING_CHECK_PIN
  })
}

function* onboardingSaga(): Iterator<Effect> {
  yield fork(tosCheckSaga)
  yield fork(pinCheckSaga)

  yield put({
    type: ONBOARDING_CHECK_TOS
  })
}

export default function* root(): Iterator<Effect> {
  /**
   * The Onboarding saga need to be started only after the Session saga is fully finished.
   * The SESSION_INITIALIZE_SUCCESS action is dispatched only when the Session is established and valid.
   */
  yield takeLatest(SESSION_INITIALIZE_SUCCESS, onboardingSaga)
}
