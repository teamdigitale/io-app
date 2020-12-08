import { fromNullable } from "fp-ts/lib/Option";
import { Millisecond } from "italia-ts-commons/lib/units";
import { getType } from "typesafe-actions";
import { Action } from "../../actions/types";
import {
  fetchTransactionsFailure,
  fetchTransactionsRequestWithExpBackoff,
  fetchTransactionsSuccess
} from "../../actions/wallet/transactions";
import {
  fetchWalletsFailure,
  fetchWalletsRequestWithExpBackoff,
  fetchWalletsSuccess
} from "../../actions/wallet/wallets";
import { GlobalState } from "../types";

export type LastRequestErrorState = {
  lastUpdate?: Date;
  attempts: number;
};

const defaultState: LastRequestErrorState = { attempts: 0 };
const backOffExpLimitAttempts = 4;
const maxBackOff = Math.pow(2, backOffExpLimitAttempts) * 1000;
const reducer = (
  state: LastRequestErrorState = defaultState,
  action: Action
): LastRequestErrorState => {
  switch (action.type) {
    case getType(fetchTransactionsRequestWithExpBackoff):
    case getType(fetchWalletsRequestWithExpBackoff): {
      const elapsed = fromNullable(state.lastUpdate).fold(
        0,
        lu => new Date().getTime() - lu.getTime()
      );
      if (elapsed > maxBackOff) {
        return defaultState;
      }
      return state;
    }
    case getType(fetchTransactionsFailure):
    case getType(fetchWalletsFailure):
      return {
        lastUpdate: new Date(),
        attempts: Math.min(state.attempts + 1, backOffExpLimitAttempts)
      };
    // on success reset state
    case getType(fetchTransactionsSuccess):
    case getType(fetchWalletsSuccess):
      return defaultState;
  }
  return state;
};

export const backOffWaitingTime = (state: GlobalState): Millisecond =>
  fromNullable(state.wallet.lastRequestError.lastUpdate).fold(
    0 as Millisecond,
    lu => {
      const wait = Math.pow(2, state.wallet.lastRequestError.attempts) * 1000;
      return (new Date().getTime() - lu.getTime() < wait
        ? wait
        : 0) as Millisecond;
    }
  );

export default reducer;
