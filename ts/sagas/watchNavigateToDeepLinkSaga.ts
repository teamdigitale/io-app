import { NavigationActions, StackActions } from "react-navigation";
import { all, Effect, put, takeLatest } from "redux-saga/effects";
import { NAVIGATE_TO_DEEPLINK } from "../store/actions/constants";
import { clearDeepLink, NavigateToDeepLink } from "../store/actions/deepLink";

export function* watchNavigateToDeepLinkSaga(): IterableIterator<Effect> {
  yield takeLatest(NAVIGATE_TO_DEEPLINK, function*(
    action: NavigateToDeepLink,
    replace: boolean = false
  ) {
    const navigationAction = replace
      ? StackActions.replace(action.payload)
      : NavigationActions.navigate(action.payload);

    yield all([put(navigationAction), put(clearDeepLink())]);
  });
}
