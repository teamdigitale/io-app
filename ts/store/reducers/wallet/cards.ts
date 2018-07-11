/**
 * Reducers, states, selectors and guards for the cards
 */
import { fromNullable, none, Option, some } from "fp-ts/lib/Option";
import _ from "lodash";
import { createSelector } from "reselect";
import { Wallet } from "../../../../definitions/pagopa/Wallet";
import { getCardId } from "../../../types/CreditCard";
import {
  CARDS_FETCHED,
  SELECT_CARD_FOR_DETAILS,
  SET_FAVORITE_CARD
} from "../../actions/constants";
import { Action } from "../../actions/types";
import { IndexedById, toIndexed } from "../../helpers/indexer";
import { GlobalState } from "../types";

export type CardsState = Readonly<{
  cards: IndexedById<Wallet>;
  selectedCardId: Option<number>;
  favoriteCardId: Option<number>;
}>;

export const CARDS_INITIAL_STATE: CardsState = {
  cards: {},
  selectedCardId: none,
  favoriteCardId: none
};

// selectors
export const getCards = (state: GlobalState) => state.wallet.cards.cards;
export const getSelectedCreditCardId = (state: GlobalState) =>
  state.wallet.cards.selectedCardId;
export const getFavoriteCreditCardId = (state: GlobalState) =>
  state.wallet.cards.favoriteCardId;

export const creditCardsSelector = createSelector(
  getCards,
  // define whether an order among cards needs to be established
  // (e.g. by insertion date, expiration date, ...)
  (cards: IndexedById<Wallet>): ReadonlyArray<Wallet> => _.values(cards)
);

export const getCardFromId = (
  cardId: Option<number>,
  cards: IndexedById<Wallet>
): Option<Wallet> => {
  if (cardId.isNone()) {
    return none;
  }
  return fromNullable(_.values(cards).find(c => getCardId(c) === cardId.value));
};

export const selectedCreditCardSelector = createSelector(
  getSelectedCreditCardId,
  getCards,
  getCardFromId
);

export const favoriteCreditCardSelector = createSelector(
  getFavoriteCreditCardId,
  getCards,
  getCardFromId
);

// reducer
const reducer = (
  state: CardsState = CARDS_INITIAL_STATE,
  action: Action
): CardsState => {
  if (action.type === CARDS_FETCHED) {
    return {
      ...state,
      cards: toIndexed(action.payload)
    };
  }
  if (action.type === SELECT_CARD_FOR_DETAILS) {
    return {
      ...state,
      selectedCardId: some(action.payload)
    };
  }
  if (action.type === SET_FAVORITE_CARD) {
    return {
      ...state,
      favoriteCardId: action.payload
    };
  }
  return state;
};

export default reducer;
