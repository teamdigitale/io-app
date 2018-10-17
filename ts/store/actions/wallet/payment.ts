import { AmountInEuroCents, RptId } from "italia-ts-commons/lib/pagopa";
import {
  ActionType,
  createAction,
  createStandardAction
} from "typesafe-actions";

import { CodiceContestoPagamento } from "../../../../definitions/backend/CodiceContestoPagamento";
import { PaymentRequestsGetResponse } from "../../../../definitions/backend/PaymentRequestsGetResponse";

import { PagoPaErrors } from "../../../types/errors";
import { Psp, Wallet } from "../../../types/pagopa";

export const resetPaymentState = createStandardAction("PAYMENT_COMPLETED")();

export const startPaymentSaga = createStandardAction("PAYMENT_REQUEST")();

type PaymentRequestTransactionSummaryFromRptIdPayload = Readonly<{
  rptId: RptId;
  initialAmount: AmountInEuroCents;
}>;

// for the first time the screen is being shown (i.e. after the
// rptId has been passed (from qr code/manual entry/message)
export const paymentRequestTransactionSummaryFromRptId = createStandardAction(
  "PAYMENT_REQUEST_TRANSACTION_SUMMARY_FROM_RPTID"
)<PaymentRequestTransactionSummaryFromRptIdPayload>();

export const paymentRequestTransactionSummaryFromBanner = createStandardAction(
  "PAYMENT_REQUEST_TRANSACTION_SUMMARY_FROM_BANNER"
)();

// For when the user taps on the payment banner and gets redirected
// to the summary of the payment.
export const setPaymentStateToSummary = createAction(
  "PAYMENT_TRANSACTION_SUMMARY_FROM_RPT_ID",
  resolve => (
    rptId: RptId,
    initialAmount: AmountInEuroCents,
    verificaResponse: PaymentRequestsGetResponse
  ) => resolve({ rptId, verificaResponse, initialAmount })
);

// for when the user taps on the payment banner and gets redirected
// to the summary of the payment
export const setPaymentStateToSummaryWithPaymentId = createStandardAction(
  "PAYMENT_TRANSACTION_SUMMARY_FROM_BANNER"
)();

type PaymentRequestContinueWithPaymentMethodsPayload = Readonly<{
  rptId: RptId;
  codiceContestoPagamento: CodiceContestoPagamento;
  currentAmount: AmountInEuroCents;
}>;

export const paymentRequestContinueWithPaymentMethods = createStandardAction(
  "PAYMENT_REQUEST_CONTINUE_WITH_PAYMENT_METHODS"
)<PaymentRequestContinueWithPaymentMethodsPayload>();

type PaymentRequestPickPaymentMethodPayload = Readonly<{
  paymentId: string;
}>;

export const paymentRequestPickPaymentMethod = createStandardAction(
  "PAYMENT_REQUEST_PICK_PAYMENT_METHOD"
)<PaymentRequestPickPaymentMethodPayload>();

export const setPaymentStateToPickPaymentMethod = createStandardAction(
  "PAYMENT_INITIAL_PICK_PAYMENT_METHOD"
)<string>();

type PaymentRequestConfirmPaymentMethodPayload = Readonly<{
  wallet: Wallet;
  paymentId: string;
}>;

export const paymentRequestConfirmPaymentMethod = createStandardAction(
  "PAYMENT_REQUEST_CONFIRM_PAYMENT_METHOD"
)<PaymentRequestConfirmPaymentMethodPayload>();

export const setPaymentStateToConfirmPaymentMethod = createAction(
  "PAYMENT_INITIAL_CONFIRM_PAYMENT_METHOD",
  resolve => (wallet: Wallet, pspList: ReadonlyArray<Psp>, paymentId: string) =>
    resolve({ selectedPaymentMethod: wallet, pspList, paymentId })
);

type PaymentRequestPickPspPayload = Readonly<{
  wallet: Wallet;
  pspList: ReadonlyArray<Psp>;
  paymentId: string;
}>;

export const paymentRequestPickPsp = createStandardAction(
  "PAYMENT_REQUEST_PICK_PSP"
)<PaymentRequestPickPspPayload>();

export const setPaymentStateToPickPsp = createAction(
  "PAYMENT_PICK_PSP",
  resolve => (wallet: Wallet, pspList: ReadonlyArray<Psp>, paymentId: string) =>
    resolve({ selectedPaymentMethod: wallet, pspList, paymentId })
);

type PaymentUpdatePspPayload = Readonly<{
  pspId: number;
  wallet: Wallet;
  paymentId: string;
}>;

export const paymentUpdatePsp = createStandardAction("PAYMENT_UPDATE_PSP")<
  PaymentUpdatePspPayload
>();

type PaymentRequestCompletionPayload = Readonly<{
  wallet: Wallet;
  paymentId: string;
}>;

export const paymentRequestCompletion = createStandardAction(
  "PAYMENT_REQUEST_COMPLETION"
)<PaymentRequestCompletionPayload>();

export const goBackOnePaymentState = createStandardAction("PAYMENT_GO_BACK")();

export const paymentRequestGoBack = createStandardAction(
  "PAYMENT_REQUEST_GO_BACK"
)();

export const paymentSetLoadingState = createStandardAction(
  "PAYMENT_SET_LOADING"
)();

export const paymentResetLoadingState = createStandardAction(
  "PAYMENT_RESET_LOADING"
)();

export const paymentCancel = createStandardAction("PAYMENT_CANCEL")();

export const paymentRequestCancel = createStandardAction(
  "PAYMENT_REQUEST_CANCEL"
)();

export const paymentFailure = createStandardAction("PAYMENT_FAILURE")<
  PagoPaErrors
>();

export const paymentVerificaRequest = createStandardAction(
  "PAYMENT_VERIFICA_REQUEST"
)();

export const paymentVerificaSuccess = createStandardAction(
  "PAYMENT_VERIFICA_SUCCESS"
)<PaymentRequestsGetResponse>();

export const paymentVerificaFailure = createStandardAction(
  "PAYMENT_VERIFICA_FAILURE"
)<PagoPaErrors>();

/**
 * All possible payment actions
 */
export type PaymentActions =
  | ActionType<typeof startPaymentSaga>
  | ActionType<typeof paymentRequestTransactionSummaryFromBanner>
  | ActionType<typeof paymentRequestTransactionSummaryFromRptId>
  | ActionType<typeof paymentRequestContinueWithPaymentMethods>
  | ActionType<typeof paymentRequestPickPaymentMethod>
  | ActionType<typeof setPaymentStateToPickPaymentMethod>
  | ActionType<typeof paymentRequestConfirmPaymentMethod>
  | ActionType<typeof setPaymentStateToConfirmPaymentMethod>
  | ActionType<typeof paymentRequestPickPsp>
  | ActionType<typeof setPaymentStateToPickPsp>
  | ActionType<typeof paymentUpdatePsp>
  | ActionType<typeof paymentRequestCompletion>
  | ActionType<typeof resetPaymentState>
  | ActionType<typeof goBackOnePaymentState>
  | ActionType<typeof paymentRequestGoBack>
  | ActionType<typeof paymentSetLoadingState>
  | ActionType<typeof paymentResetLoadingState>
  | ActionType<typeof paymentCancel>
  | ActionType<typeof paymentRequestCancel>
  | ActionType<typeof paymentFailure>
  | ActionType<typeof paymentVerificaRequest>
  | ActionType<typeof paymentVerificaSuccess>
  | ActionType<typeof paymentVerificaFailure>;
