/**
 * Return true if function is enabled for the wallet (aka payment method)
 * @param wallet
 */
import {
  EnableableFunctionsTypeEnum,
  PatchedPaymentMethodInfo,
  PatchedWalletV2,
  PaymentMethod,
  PaymentMethodInfo,
  Wallet
} from "../types/pagopa";
import { TypeEnum as WalletTypeEnumV1 } from "../../definitions/pagopa/Wallet";
import { WalletTypeEnum } from "../../definitions/pagopa/walletv2/WalletV2";
import { CardInfo } from "../../definitions/pagopa/walletv2/CardInfo";
import { SatispayInfo } from "../../definitions/pagopa/walletv2/SatispayInfo";
import {
  CreditCardExpirationMonth,
  CreditCardExpirationYear,
  CreditCardPan
} from "./input";

/**
 * true if the given wallet support the given walletFunction
 * @param wallet
 * @param walletFunction
 */
export const hasFunctionEnabled = (
  paymentMethod: PaymentMethod,
  walletFunction: EnableableFunctionsTypeEnum
) => paymentMethod.enableableFunctions.includes(walletFunction);

const isBPay = (
  wallet: PatchedWalletV2,
  paymentMethodInfo: PatchedPaymentMethodInfo
): paymentMethodInfo is CardInfo =>
  (paymentMethodInfo && wallet.walletType === WalletTypeEnum.BPay) ||
  wallet.walletType === WalletTypeEnum.BPay;

const isSatispay = (
  wallet: PatchedWalletV2,
  paymentMethodInfo: PatchedPaymentMethodInfo
): paymentMethodInfo is SatispayInfo =>
  paymentMethodInfo && wallet.walletType === WalletTypeEnum.Satispay;

const isBancomat = (
  wallet: PatchedWalletV2,
  paymentMethodInfo: PatchedPaymentMethodInfo
): paymentMethodInfo is CardInfo =>
  paymentMethodInfo && wallet.walletType === WalletTypeEnum.Bancomat;

const isCreditCard = (
  wallet: PatchedWalletV2,
  paymentMethodInfo: PatchedPaymentMethodInfo
): paymentMethodInfo is CardInfo =>
  paymentMethodInfo && wallet.walletType === WalletTypeEnum.Card;

const getPaymentMethodInfo = (wallet: PatchedWalletV2): PaymentMethodInfo => {
  if (isCreditCard(wallet, wallet.info)) {
    return { creditCard: wallet.info, type: WalletTypeEnum.Card };
  }
  if (isBancomat(wallet, wallet.info)) {
    return { bancomat: wallet.info, type: WalletTypeEnum.Bancomat };
  }
  if (isSatispay(wallet, wallet.info)) {
    return { satispay: wallet.info, type: WalletTypeEnum.Satispay };
  }
  if (isBPay(wallet, wallet.info)) {
    return { bPay: wallet.info, type: WalletTypeEnum.BPay };
  }
  return { type: "UNKNOWN" };
};

/**
 * inject walletV2 into walletV1 structure
 * @param walletV2
 */
export const convertWalletV2toWalletV1 = (
  walletV2: PatchedWalletV2
): Wallet => {
  const info = walletV2.info;
  const cc = isCreditCard(walletV2, info)
    ? {
        id: undefined,
        holder: info.holder ?? "",
        pan: info.blurredNumber as CreditCardPan,
        expireMonth: info.expireMonth as CreditCardExpirationMonth,
        expireYear: info.expireYear as CreditCardExpirationYear,
        brandLogo: info.brandLogo,
        flag3dsVerified: true,
        brand: info.brand,
        onUs: true,
        securityCode: undefined
      }
    : undefined;

  return {
    idWallet: walletV2.idWallet,
    type:
      walletV2.walletType === WalletTypeEnum.Card
        ? WalletTypeEnumV1.CREDIT_CARD
        : WalletTypeEnumV1.EXTERNAL_PS,
    favourite: walletV2.favourite,
    creditCard: cc,
    psp: undefined,
    idPsp: undefined,
    pspEditable: false,
    lastUsage: walletV2.updateDate ? new Date(walletV2.updateDate) : undefined,
    isPspToIgnore: false,
    registeredNexi: false,
    saved: true,
    paymentMethod: {
      ...walletV2,
      info: getPaymentMethodInfo(walletV2)
    }
  };
};
