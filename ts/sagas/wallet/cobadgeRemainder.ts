import { put, select, take } from "redux-saga/effects";
import {
  bancomatListVisibleInWalletSelector,
  cobadgeListVisibleInWalletSelector
} from "../../store/reducers/wallet/wallets";
import * as pot from "italia-ts-commons/lib/pot";
import {
  BancomatPaymentMethod,
  CreditCardPaymentMethod
} from "../../types/pagopa";
import { coBadgeAbiConfigurationSelector } from "../../features/wallet/onboarding/cobadge/store/reducers/abiConfiguration";
import { IndexedById } from "../../store/helpers/indexer";
import { StatusEnum } from "../../../definitions/pagopa/cobadge/configuration/CoBadgeService";
import { NetworkError } from "../../utils/errors";
import { loadCoBadgeAbiConfiguration } from "../../features/wallet/onboarding/cobadge/store/actions";
import { getType, isActionOf } from "typesafe-actions";
import { sendAddCobadgeMessage } from "../../store/actions/wallet/wallets";
import { RTron } from "../../boot/configureStoreAndPersistor";

/**
 * This saga aims to send an event to Mixpanel to get information about whether the user has a bancomat card with which
 * it is allowed to add a co-badge card and has not yet done or not.
 *
 * This saga is called only if the {@link bancomatListVisibleInWalletSelector} return some
 */
export function* sendAddCobadgeMessageSaga() {
  RTron.log("entra");
  // Check if there is at least one bancomat
  const maybeBancomatListVisibleInWallet: pot.Pot<
    ReadonlyArray<BancomatPaymentMethod>,
    Error
  > = yield select(bancomatListVisibleInWalletSelector);

  const bancomatListVisibleInWallet = pot.getOrElse(
    maybeBancomatListVisibleInWallet,
    []
  );

  if (bancomatListVisibleInWallet.length === 0) {
    yield put(sendAddCobadgeMessage(false));
    RTron.log("no bancomat");
    return;
  }

  // Extract the cobadgeAbi if there is at least a cobadge card
  const maybeCobadgeVisibleInWallet: pot.Pot<
    ReadonlyArray<CreditCardPaymentMethod>,
    Error
  > = yield select(cobadgeListVisibleInWalletSelector);

  const cobadgeVisibleInWallet = pot.getOrElse(maybeCobadgeVisibleInWallet, []);
  const cobadgeAbis = cobadgeVisibleInWallet
    .filter(c => c.info.issuerAbiCode !== undefined)
    .map(cWithAbi => cWithAbi.info.issuerAbiCode);

  // Check if the abiConfiguration is Some
  // and if not request the abiConfiguration
  if (!pot.isSome(yield select(coBadgeAbiConfigurationSelector))) {
    yield put(loadCoBadgeAbiConfiguration.request());

    // Wait for the request results
    const loadCoBadgeAbiRes = yield take([
      getType(loadCoBadgeAbiConfiguration.success),
      getType(loadCoBadgeAbiConfiguration.failure)
    ]);

    // If the request result is failure return
    if (isActionOf(loadCoBadgeAbiConfiguration.failure, loadCoBadgeAbiRes)) {
      return;
    }
  }
  const maybeCoBadgeAbiConfiguration: pot.Pot<
    IndexedById<StatusEnum>,
    NetworkError
  > = yield select(coBadgeAbiConfigurationSelector);

  if (pot.isSome(maybeCoBadgeAbiConfiguration)) {
    const coBadgeAbiConfiguration = maybeCoBadgeAbiConfiguration.value;

    // Extract a list of abi that satisfy the following conditions:
    // - is a bancomat in the wallet of the user
    // - the abi of the bancomat is in the abiConfiguration list
    // - the abi of the bancomant has the status enabled in the abiConfiguration list
    // - there isn't a cobadge card in the wallet of the user with the sami abi
    const enalbedAbis = bancomatListVisibleInWallet.filter(
      b =>
        b.info.issuerAbiCode !== undefined &&
        coBadgeAbiConfiguration[b.info.issuerAbiCode] !== undefined &&
        coBadgeAbiConfiguration[b.info.issuerAbiCode] === StatusEnum.enabled &&
        cobadgeAbis.filter(abi => abi === b.info.issuerAbiCode).length === 0
    );

    if (enalbedAbis.length > 0) {
      RTron.log("invia messaggio");
      yield put(sendAddCobadgeMessage(true));
    } else {
      RTron.log("non invia messaggio");
      yield put(sendAddCobadgeMessage(false));
    }
  }
}
