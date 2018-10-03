import { NavigationState } from "react-navigation";
import {
  ActionType,
  createAction,
  createStandardAction
} from "typesafe-actions";

export const navigationHistoryPush = createAction(
  "NAVIGATION_HISTORY_PUSH",
  resolve => (navigationState: NavigationState) => resolve(navigationState)
);

export const navigationHistoryReset = createStandardAction(
  "NAVIGATION_HISTORY_RESET"
)();

export const navigationHistoryPop = createStandardAction(
  "NAVIGATION_HISTORY_POP"
)();

export type NavigationHistoryActions = ActionType<
  | typeof navigationHistoryPush
  | typeof navigationHistoryReset
  | typeof navigationHistoryPop
>;
