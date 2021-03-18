import { getType } from "typesafe-actions";
import { createSelector } from "reselect";
import { Action } from "../../../../../../store/actions/types";
import { GlobalState } from "../../../../../../store/reducers/types";
import {
  isLoading,
  isReady,
  remoteError,
  remoteLoading,
  remoteReady,
  remoteUndefined,
  RemoteValue
} from "../../../../bpd/model/RemoteValue";
import { NetworkError } from "../../../../../../utils/errors";
import {
  cgnEycaActivation,
  cgnEycaActivationStatusRequest
} from "../../actions/eyca/activation";

export type CgnEycaActivationStatus =
  | "POLLING"
  | "POLLING_TIMEOUT"
  | "COMPLETED"
  | "INELIGIBLE"
  | "ALREADY_ACTIVE"
  | "ERROR";

export type EycaActivationState = RemoteValue<
  CgnEycaActivationStatus,
  NetworkError
>;

const INITIAL_STATE: EycaActivationState = remoteUndefined;

const reducer = (
  state: EycaActivationState = INITIAL_STATE,
  action: Action
): EycaActivationState => {
  switch (action.type) {
    // bonus activation
    case getType(cgnEycaActivation.request):
    case getType(cgnEycaActivationStatusRequest):
      return remoteLoading;
    case getType(cgnEycaActivation.success):
      return remoteReady(action.payload);
    case getType(cgnEycaActivation.failure):
      return remoteError(action.payload);
  }
  return state;
};

// Selectors
export const eycaActivationStatusSelector = (
  state: GlobalState
): EycaActivationState => state.bonus.cgn.eyca.activation;

// return the cgn eyca status
export const cgnEycaActivationStatus = createSelector(
  eycaActivationStatusSelector,
  (activation: EycaActivationState): CgnEycaActivationStatus | undefined =>
    isReady(activation) ? activation.value : undefined
);

export const cgnEycaActivationLoading = createSelector(
  eycaActivationStatusSelector,
  (activation: EycaActivationState): boolean => isLoading(activation)
);

export default reducer;
