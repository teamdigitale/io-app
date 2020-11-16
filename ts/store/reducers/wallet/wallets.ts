/**
 * Reducers, states, selectors and guards for the cards
 */
import * as pot from "italia-ts-commons/lib/pot";
import { values } from "lodash";
import { createSelector } from "reselect";
import { getType, isOfType } from "typesafe-actions";

import { PotFromActions } from "../../../types/utils";
import { isDefined } from "../../../utils/guards";
import { Action } from "../../actions/types";
import { paymentUpdateWalletPsp } from "../../actions/wallet/payment";
import {
  addWalletCreditCardFailure,
  addWalletCreditCardInit,
  addWalletCreditCardRequest,
  addWalletCreditCardSuccess,
  creditCardCheckout3dsRequest,
  creditCardCheckout3dsSuccess,
  deleteWalletFailure,
  deleteWalletRequest,
  deleteWalletSuccess,
  fetchWalletsFailure,
  fetchWalletsRequest,
  fetchWalletsSuccess,
  payCreditCardVerificationFailure,
  payCreditCardVerificationRequest,
  payCreditCardVerificationSuccess,
  setFavouriteWalletFailure,
  setFavouriteWalletRequest,
  setFavouriteWalletSuccess
} from "../../actions/wallet/wallets";
import { IndexedById, toIndexed } from "../../helpers/indexer";
import { GlobalState } from "../types";
import { WalletTypeEnum } from "../../../../definitions/pagopa/walletv2/WalletV2";
import { PatchedWalletV2, Wallet } from "../../../types/pagopa";

export type WalletsState = Readonly<{
  walletById: PotFromActions<IndexedById<Wallet>, typeof fetchWalletsFailure>;
  favoriteWalletId: pot.Pot<Wallet["idWallet"], string>;
  creditCardAddWallet: PotFromActions<
    typeof addWalletCreditCardSuccess,
    typeof addWalletCreditCardFailure
  >;
  creditCardVerification: PotFromActions<
    typeof payCreditCardVerificationSuccess,
    typeof payCreditCardVerificationFailure
  >;
  creditCardCheckout3ds: PotFromActions<
    typeof creditCardCheckout3dsSuccess,
    never
  >;
}>;

const WALLETS_INITIAL_STATE: WalletsState = {
  walletById: pot.none,
  favoriteWalletId: pot.none,
  creditCardAddWallet: pot.none,
  creditCardVerification: pot.none,
  creditCardCheckout3ds: pot.none
};

// selectors
export const getWalletsById = (state: GlobalState) =>
  state.wallet.wallets.walletById;

const getWallets = createSelector(getWalletsById, potWx =>
  pot.map(
    potWx,
    wx => values(wx).filter(_ => _ !== undefined) as ReadonlyArray<Wallet>
  )
);

export const getFavoriteWalletId = (state: GlobalState) =>
  state.wallet.wallets.favoriteWalletId;

export const getFavoriteWallet = (state: GlobalState) =>
  pot.mapNullable(state.wallet.wallets.favoriteWalletId, walletId =>
    pot.toUndefined(
      pot.map(state.wallet.wallets.walletById, wx => wx[walletId])
    )
  );

/**
 * @deprecated Using API v2 this selector is deprecated
 * If you are searching for credit card or bancomat use {@link creditCardSelector}
 * - {@link pagoPaCreditCardSelector} {@link bancomatSelector} instead
 */
export const walletsSelector = createSelector(
  getWallets,
  // define whether an order among cards needs to be established
  // (e.g. by insertion date, expiration date, ...)
  (
    potWallets: ReturnType<typeof getWallets>
  ): pot.Pot<ReadonlyArray<Wallet>, Error> =>
    pot.map(potWallets, wallets =>
      [...wallets].sort(
        // sort by date, descending
        // if both dates are undefined -> 0
        // if either is undefined, it is considered as used "infinitely" long ago
        // (i.e. the non-undefined one is considered as used more recently)
        (a, b) =>
          -(a.lastUsage === undefined
            ? b.lastUsage === undefined
              ? 0
              : -1
            : b.lastUsage === undefined
            ? 1
            : a.lastUsage.getTime() - b.lastUsage.getTime())
      )
    )
);
/**
 * Get a list of WalletV2 extracted from WalletV1
 */
export const walletV2Selector = createSelector([walletsSelector], potWallet =>
  pot.map(potWallet, wallets => wallets.map(w => w.v2).filter(isDefined))
);

/**
 * Get the list of credit cards using the info contained in v2 (Walletv2) to distinguish
 */
export const creditCardSelector = createSelector(
  [walletsSelector],
  (
    potWallet: pot.Pot<ReadonlyArray<Wallet>, Error>
  ): pot.Pot<ReadonlyArray<Wallet>, Error> =>
    pot.map(potWallet, wallets =>
      wallets.filter(w => w.v2?.walletType === WalletTypeEnum.Card)
    )
);

/**
 * Get the list of credit cards usable as payment instrument in pagoPA
 * using the info contained in v2 (Walletv2) to distinguish
 */
export const pagoPaCreditCardSelector = createSelector(
  [creditCardSelector],
  (
    potCreditCards: pot.Pot<ReadonlyArray<Wallet>, Error>
  ): pot.Pot<ReadonlyArray<Wallet>, Error> =>
    pot.map(potCreditCards, wallets =>
      wallets.filter(w => w.v2?.pagoPA === true)
    )
);

/**
 * Get the list of bancomat cards using the info contained in v2 (Walletv2) to distinguish
 */
export const bancomatSelector = createSelector(
  [walletV2Selector],
  (
    potWallet: pot.Pot<ReadonlyArray<PatchedWalletV2>, Error>
  ): pot.Pot<ReadonlyArray<PatchedWalletV2>, Error> =>
    pot.map(potWallet, wallets =>
      wallets.filter(w2 => w2.walletType === WalletTypeEnum.Bancomat)
    )
);

// reducer
// eslint-disable-next-line complexity
const reducer = (
  state: WalletsState = WALLETS_INITIAL_STATE,
  action: Action
): WalletsState => {
  switch (action.type) {
    //
    // fetch wallets
    //

    case getType(fetchWalletsRequest):
    case getType(paymentUpdateWalletPsp.request):
    case getType(deleteWalletRequest):
      return {
        ...state,
        favoriteWalletId: pot.toLoading(state.favoriteWalletId),
        walletById: pot.toLoading(state.walletById)
      };

    case getType(fetchWalletsSuccess):
    case getType(paymentUpdateWalletPsp.success):
    case getType(deleteWalletSuccess):
      const wallets = isOfType(getType(paymentUpdateWalletPsp.success), action)
        ? action.payload.wallets
        : action.payload;
      const favouriteWallet = wallets.find(_ => _.favourite === true);
      const newState = {
        ...state,
        walletById: pot.some(toIndexed(wallets, _ => _.idWallet))
      };
      return {
        ...newState,
        favoriteWalletId:
          favouriteWallet !== undefined
            ? pot.some(favouriteWallet.idWallet)
            : pot.none
      };

    case getType(fetchWalletsFailure):
    case getType(deleteWalletFailure):
    case getType(paymentUpdateWalletPsp.failure):
      return {
        ...state,
        favoriteWalletId: pot.toError(
          state.favoriteWalletId,
          action.payload.message
        ),
        walletById: pot.toError(state.walletById, action.payload)
      };

    //
    // set favourite wallet
    //

    case getType(setFavouriteWalletRequest):
      return {
        ...state,
        favoriteWalletId:
          action.payload === undefined
            ? pot.none
            : pot.toUpdating(state.favoriteWalletId, action.payload)
      };

    case getType(setFavouriteWalletSuccess):
      // On success, we update both the favourite wallet ID and the
      // corresponding Wallet in walletById.
      // Note that we don't update the Wallet that was previously the
      // favourite one.
      return {
        ...state,
        favoriteWalletId: pot.some(action.payload.idWallet),
        walletById: {
          ...state.walletById,
          [action.payload.idWallet]: action.payload
        }
      };

    case getType(setFavouriteWalletFailure):
      return {
        ...state,
        favoriteWalletId: pot.toError(
          state.favoriteWalletId,
          action.payload.message
        )
      };

    //
    // add credit card
    //

    case getType(addWalletCreditCardInit):
      return {
        ...state,
        creditCardAddWallet: pot.none,
        creditCardVerification: pot.none,
        creditCardCheckout3ds: pot.none
      };

    case getType(addWalletCreditCardRequest):
      return {
        ...state,
        creditCardAddWallet: pot.noneLoading
      };

    case getType(addWalletCreditCardSuccess):
      return {
        ...state,
        creditCardAddWallet: pot.some(action.payload)
      };

    case getType(addWalletCreditCardFailure):
      return {
        ...state,
        creditCardAddWallet: pot.noneError(action.payload)
      };

    //
    // pay credit card verification
    //

    case getType(payCreditCardVerificationRequest):
      return {
        ...state,
        creditCardVerification: pot.noneLoading
      };

    case getType(payCreditCardVerificationSuccess):
      return {
        ...state,
        creditCardVerification: pot.some(action.payload)
      };

    case getType(payCreditCardVerificationFailure):
      return {
        ...state,
        creditCardVerification: pot.noneError(action.payload)
      };

    //
    // credit card 3ds checkout
    //

    case getType(creditCardCheckout3dsRequest):
      // a valid URL has been made available
      // from pagoPA and needs to be opened in a webview
      const urlWithToken = `${action.payload.urlCheckout3ds}&sessionToken=${action.payload.paymentManagerToken}`;

      return {
        ...state,
        creditCardCheckout3ds: pot.someLoading(urlWithToken)
      };

    case getType(creditCardCheckout3dsSuccess):
      return {
        ...state,
        creditCardCheckout3ds: pot.some("done")
      };

    default:
      return state;
  }
};

export default reducer;
