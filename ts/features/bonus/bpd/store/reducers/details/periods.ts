import * as pot from "italia-ts-commons/lib/pot";
import { createSelector } from "reselect";
import { getType } from "typesafe-actions";
import { Action } from "../../../../../../store/actions/types";
import { IndexedById } from "../../../../../../store/helpers/indexer";
import { GlobalState } from "../../../../../../store/reducers/types";
import { isDefined } from "../../../../../../utils/guards";
import { AwardPeriodId, bpdPeriodsAmountLoad } from "../../actions/periods";
import { BpdPeriodAmount } from "./combiner";

/**
 * Store all the cashback periods with amounts
 * @param state
 * @param action
 */
export const bpdPeriodsReducer = (
  state: pot.Pot<IndexedById<BpdPeriodAmount>, Error> = pot.none,
  action: Action
): pot.Pot<IndexedById<BpdPeriodAmount>, Error> => {
  switch (action.type) {
    case getType(bpdPeriodsAmountLoad.request):
      return pot.toLoading(state);
    case getType(bpdPeriodsAmountLoad.success):
      return pot.some(
        action.payload.reduce(
          (acc: IndexedById<BpdPeriodAmount>, curr: BpdPeriodAmount) => ({
            ...acc,
            [curr.period.awardPeriodId]: curr
          }),
          {}
        )
      );
    case getType(bpdPeriodsAmountLoad.failure):
      return pot.toError(state, action.payload);
  }

  return state;
};

/**
 * Return the pot.Pot for IndexedById<BpdPeriod>, memoized to avoid recalculations
 */
export const bpdPeriodsSelector = createSelector(
  [(state: GlobalState) => state.bonus.bpd.details.periods],
  (potValue): pot.Pot<ReadonlyArray<BpdPeriodAmount>, Error> =>
    pot.map(potValue, potValue => Object.values(potValue).filter(isDefined))
);

/**
 * Raw selector for a specific period (if exists)
 * @param state
 * @param id
 */
const bpdPeriodByIdRawSelector = (
  state: GlobalState,
  id: AwardPeriodId
): pot.Pot<BpdPeriodAmount | undefined, Error> =>
  pot.map(state.bonus.bpd.details.periods, periodList => periodList[id]);

/**
 * Return a specific period (if exists)
 */
export const bpdPeriodByIdSelector = createSelector(
  [bpdPeriodByIdRawSelector],
  period => period
);
