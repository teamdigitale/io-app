/**
 * pagoPA backend client, with functions
 * to call the different API available
 */
import {
  ApiHeaderJson,
  AuthorizationBearerHeaderProducer,
  composeHeaderProducers,
  createFetchRequestForApi,
  IGetApiRequestType,
  IPostApiRequestType,
  IPutApiRequestType,
  ResponseDecoder,
  TypeofApiCall
} from "italia-ts-commons/lib/requests";
import { PaymentResponse } from "../../definitions/pagopa/PaymentResponse";
import {
  PspListResponse,
  SessionResponse,
  TransactionListResponse,
  TransactionResponse,
  WalletListResponse,
  WalletResponse
} from "../types/pagopa";
import { defaultRetryingFetch } from "../utils/fetch";
import {
  basicResponseDecoderWith401,
  BasicResponseTypeWith401
} from "./backend";

// builds on top of basicResponseDecoderWith401 and
// casts the result to a type T: this is in order to
// work around the fact that io-ts's refinements do
// not produce static types in agreement with the
// dynamic ones
// e.g. this produces an error
// const a: Amount = Amount.decode({ ... }).getOrElse({ ... })
const basicResponseDecoderWith401AndCast = <T>(
  type: any
): ResponseDecoder<BasicResponseTypeWith401<T>> =>
  basicResponseDecoderWith401(type);

type TokenParamType = Readonly<{
  token: string;
}>;

type GetSessionType = IGetApiRequestType<
  TokenParamType,
  never,
  keyof TokenParamType, // ?token=ABC... using the same name as the param
  BasicResponseTypeWith401<SessionResponse>
>;

type GetTransactionsType = IGetApiRequestType<
  {},
  "Authorization",
  never,
  BasicResponseTypeWith401<TransactionListResponse>
>;

type GetWalletsType = IGetApiRequestType<
  {},
  "Authorization",
  never,
  BasicResponseTypeWith401<WalletListResponse>
>;

type CheckPaymentType = IGetApiRequestType<
  {
    paymentId: string;
  },
  "Authorization",
  never,
  BasicResponseTypeWith401<PaymentResponse>
>;

type GetPspsListType = IGetApiRequestType<
  {
    paymentId: string;
  },
  "Authorization",
  "idPayment" | "paymentType",
  BasicResponseTypeWith401<PspListResponse>
>;

type UpdateWalletPspType = IPutApiRequestType<
  {
    walletId: number;
    pspId: number;
  },
  "Content-Type" | "Authorization",
  never,
  BasicResponseTypeWith401<WalletResponse>
>;

type PostPaymentType = IPostApiRequestType<
  {
    walletId: number;
    paymentId: string;
  },
  "Content-Type" | "Authorization",
  never,
  BasicResponseTypeWith401<TransactionResponse>
>;

export type PagoPaClient = Readonly<{
  getSession: (
    walletToken: string
  ) => ReturnType<TypeofApiCall<GetSessionType>>;
  getTransactions: (
    pagoPaToken: string
  ) => ReturnType<TypeofApiCall<GetTransactionsType>>;
  getWallets: (
    pagoPaToken: string
  ) => ReturnType<TypeofApiCall<GetWalletsType>>;
  checkPayment: (
    pagoPaToken: string,
    paymentId: string
  ) => ReturnType<TypeofApiCall<CheckPaymentType>>;
  getPspList: (
    pagoPaToken: string,
    paymentId: string
  ) => ReturnType<TypeofApiCall<GetPspsListType>>;
  updateWalletPsp: (
    pagoPaToken: string,
    walletId: number,
    pspId: number
  ) => ReturnType<TypeofApiCall<UpdateWalletPspType>>;
  postPayment: (
    pagoPaToken: string,
    paymentId: string,
    walletId: number
  ) => ReturnType<TypeofApiCall<PostPaymentType>>;
  walletToken: string;
}>;

export const PagoPaClient = (
  baseUrl: string,
  walletToken: string,
  fetchApi: typeof fetch = defaultRetryingFetch()
): PagoPaClient => {
  const options = { baseUrl, fetchApi };

  const getSession: GetSessionType = {
    method: "get",
    url: _ => "/v1/users/actions/start-session",
    query: t => t,
    headers: () => ({}),
    response_decoder: basicResponseDecoderWith401AndCast<SessionResponse>(
      SessionResponse
    )
  };

  const getTransactions: (
    pagoPaToken: string
  ) => GetTransactionsType = pagoPaToken => ({
    method: "get",
    url: () => "/v1/transactions",
    query: () => ({}),
    headers: AuthorizationBearerHeaderProducer(pagoPaToken),
    response_decoder: basicResponseDecoderWith401AndCast<
      TransactionListResponse
    >(TransactionListResponse)
  });

  const getWallets: (pagoPaToken: string) => GetWalletsType = pagoPaToken => ({
    method: "get",
    url: () => "/v1/wallet",
    query: () => ({}),
    headers: AuthorizationBearerHeaderProducer(pagoPaToken),
    response_decoder: basicResponseDecoderWith401AndCast<WalletListResponse>(
      WalletListResponse
    )
  });

  const checkPayment: (
    pagoPaToken: string
  ) => CheckPaymentType = pagoPaToken => ({
    method: "get",
    url: ({ paymentId }) => `/v1/payments/${paymentId}/actions/check`,
    query: () => ({}),
    headers: AuthorizationBearerHeaderProducer(pagoPaToken),
    response_decoder: basicResponseDecoderWith401AndCast<PaymentResponse>(
      PaymentResponse
    )
  });

  const getPspList: (pagoPaToken: string) => GetPspsListType = pagoPaToken => ({
    method: "get",
    url: () => "/v1/psps",
    query: ({ paymentId }) => ({
      paymentType: "CREDIT_CARD",
      idPayment: paymentId
    }),
    headers: AuthorizationBearerHeaderProducer(pagoPaToken),
    response_decoder: basicResponseDecoderWith401AndCast<PspListResponse>(
      PspListResponse
    )
  });

  const updateWalletPsp: (
    pagoPaToken: string
  ) => UpdateWalletPspType = pagoPaToken => ({
    method: "put",
    url: ({ walletId }) => `/v1/wallet/${walletId}`,
    query: () => ({}),
    body: ({ pspId }) =>
      JSON.stringify({
        data: {
          type: "CREDIT_CARD",
          idPsp: pspId
        }
      }),
    headers: composeHeaderProducers(
      AuthorizationBearerHeaderProducer(pagoPaToken),
      ApiHeaderJson
    ),
    response_decoder: basicResponseDecoderWith401AndCast<WalletResponse>(
      WalletResponse
    )
  });

  const postPayment: (
    pagoPaToken: string
  ) => PostPaymentType = pagoPaToken => ({
    method: "post",
    url: ({ paymentId }) => `/v1/payments/${paymentId}/actions/pay`,
    query: () => ({}),
    body: ({ walletId }) =>
      JSON.stringify({
        data: {
          tipo: "web",
          idWallet: `${walletId}`
        }
      }),
    headers: composeHeaderProducers(
      AuthorizationBearerHeaderProducer(pagoPaToken),
      ApiHeaderJson
    ),
    response_decoder: basicResponseDecoderWith401AndCast<TransactionResponse>(
      TransactionResponse
    )
  });

  return {
    walletToken,
    getSession: (
      wt: string // wallet token
    ) => createFetchRequestForApi(getSession, options)({ token: wt }),
    getWallets: (pagoPaToken: string) =>
      createFetchRequestForApi(getWallets(pagoPaToken), options)({}),
    getTransactions: (pagoPaToken: string) =>
      createFetchRequestForApi(getTransactions(pagoPaToken), options)({}),
    checkPayment: (pagoPaToken: string, paymentId: string) =>
      createFetchRequestForApi(checkPayment(pagoPaToken), options)({
        paymentId
      }),
    getPspList: (pagoPaToken: string, paymentId: string) =>
      createFetchRequestForApi(getPspList(pagoPaToken), options)({
        paymentId
      }),
    updateWalletPsp: (pagoPaToken: string, walletId: number, pspId: number) =>
      createFetchRequestForApi(updateWalletPsp(pagoPaToken), options)({
        walletId,
        pspId
      }),
    postPayment: (pagoPaToken: string, paymentId: string, walletId: number) =>
      createFetchRequestForApi(postPayment(pagoPaToken), options)({
        paymentId,
        walletId
      })
  };
};
