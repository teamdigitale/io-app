import { fromNullable } from "fp-ts/lib/Option";
import { Millisecond } from "italia-ts-commons/lib/units";
import { getType } from "typesafe-actions";
import _ from "lodash";
import { Action } from "../../actions/types";
import {
  fetchTransactionsFailure,
  fetchTransactionsSuccess
} from "../../actions/wallet/transactions";
import {
  addWalletCreditCardFailure,
  addWalletCreditCardSuccess,
  fetchWalletsFailure,
  fetchWalletsSuccess,
  payCreditCardVerificationFailure,
  payCreditCardVerificationSuccess
} from "../../actions/wallet/wallets";
import { GlobalState } from "../types";
import { bpdLoadActivationStatus } from "../../../features/bonus/bpd/store/actions/details";
import { bpdPeriodsAmountLoad } from "../../../features/bonus/bpd/store/actions/periods";

export type LastRequestErrorState = {
  [key: string]: {
    lastUpdate: Date;
    attempts: number;
  };
};

/**
 * list of failure actions
 * if any of these is dispatched, a backoff record will be created
 * and it will be used to calculate the backoff waiting time
 */
const failureActions = [
  payCreditCardVerificationFailure,
  addWalletCreditCardFailure,
  fetchTransactionsFailure,
  fetchWalletsFailure,
  bpdLoadActivationStatus.failure,
  bpdPeriodsAmountLoad.failure
];

/**
 * list of success actions
 * if any of these is dispatched, the existing backoff record into the store will be deleted
 */
const successActionTypes = [
  payCreditCardVerificationSuccess,
  addWalletCreditCardSuccess,
  fetchTransactionsSuccess,
  fetchWalletsSuccess,
  bpdLoadActivationStatus.success,
  bpdPeriodsAmountLoad.success
].map(getType);

const failureActionTypes = failureActions.map(getType);
export type FailureActions = typeof failureActions[0];

const defaultState: LastRequestErrorState = {};
const backOffExpLimitAttempts = 4;
const backOffBase = 2;
const reducer = (
  state: LastRequestErrorState = defaultState,
  action: Action
): LastRequestErrorState => {
  const failure = failureActionTypes.find(a => a === action.type);
  const success = successActionTypes.find(a => a === action.type);
  if (failure) {
    return {
      ...state,
      [failure]: {
        lastUpdate: new Date(),
        attempts: Math.min(
          (state[failure]?.attempts ?? 0) + 1,
          backOffExpLimitAttempts
        )
      }
    };
  } else if (success) {
    return _.omit(state, success);
  }
  return state;
};

// return the waiting time from a given failure action
export const backOffWaitingTime = (state: GlobalState) => (
  failure: FailureActions
): Millisecond =>
  fromNullable(state.wallet.lastRequestError[getType(failure)]).fold(
    0 as Millisecond,
    lastError => {
      const wait = Math.pow(backOffBase, lastError.attempts) * 1000;
      return (new Date().getTime() - lastError.lastUpdate.getTime() < wait
        ? wait
        : 0) as Millisecond;
    }
  );

export default reducer;
