import { getType } from "typesafe-actions";
import { createSelector } from "reselect";
import { NetworkError } from "../../../../../utils/errors";
import { Action } from "../../../../../store/actions/types";
import { GlobalState } from "../../../../../store/reducers/types";
import {
  cgnOfflineMerchants,
  cgnOnlineMerchants,
  cgnSelectedMerchant
} from "../actions/merchants";
import {
  remoteError,
  remoteLoading,
  remoteReady,
  remoteUndefined,
  RemoteValue
} from "../../../bpd/model/RemoteValue";
import { Merchant } from "../../../../../../definitions/cgn/merchants/Merchant";
import { OnlineMerchants } from "../../../../../../definitions/cgn/merchants/OnlineMerchants";
import { OfflineMerchants } from "../../../../../../definitions/cgn/merchants/OfflineMerchants";

export type CgnMerchantsState = {
  onlineMerchants: RemoteValue<OnlineMerchants["items"], NetworkError>;
  offlineMerchants: RemoteValue<OfflineMerchants["items"], NetworkError>;
  selectedMerchant: RemoteValue<Merchant, NetworkError>;
};

const INITIAL_STATE: CgnMerchantsState = {
  onlineMerchants: remoteUndefined,
  offlineMerchants: remoteUndefined,
  selectedMerchant: remoteUndefined
};

const reducer = (
  state: CgnMerchantsState = INITIAL_STATE,
  action: Action
): CgnMerchantsState => {
  switch (action.type) {
    // Offline Merchants
    case getType(cgnOfflineMerchants.request):
      return {
        ...state,
        offlineMerchants: remoteLoading
      };
    case getType(cgnOfflineMerchants.success):
      return {
        ...state,
        offlineMerchants: remoteReady(action.payload)
      };
    case getType(cgnOfflineMerchants.failure):
      return {
        ...state,
        offlineMerchants: remoteError(action.payload)
      };

    // Online Merchants
    case getType(cgnOnlineMerchants.request):
      return {
        ...state,
        onlineMerchants: remoteLoading
      };
    case getType(cgnOnlineMerchants.success):
      return {
        ...state,
        onlineMerchants: remoteReady(action.payload)
      };
    case getType(cgnOnlineMerchants.failure):
      return {
        ...state,
        onlineMerchants: remoteError(action.payload)
      };

    // Selected Merchant detail
    case getType(cgnSelectedMerchant.request):
      return {
        ...state,
        selectedMerchant: remoteLoading
      };
    case getType(cgnSelectedMerchant.success):
      return {
        ...state,
        selectedMerchant: remoteReady(action.payload)
      };
    case getType(cgnSelectedMerchant.failure):
      return {
        ...state,
        selectedMerchant: remoteError(action.payload)
      };
  }
  return state;
};

export default reducer;

export const cgnMerchantsSelector = (state: GlobalState) =>
  state.bonus.cgn.merchants;

export const cgnOnlineMerchantsSelector = createSelector(
  cgnMerchantsSelector,
  merchantsState => merchantsState.onlineMerchants
);

export const cgnOfflineMerchantsSelector = createSelector(
  cgnMerchantsSelector,
  merchantsState => merchantsState.offlineMerchants
);

export const cgnSelectedMerchantSelector = createSelector(
  cgnMerchantsSelector,
  merchantsState => merchantsState.selectedMerchant
);
