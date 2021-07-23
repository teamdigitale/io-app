import {
  ApiHeaderJson,
  composeHeaderProducers,
  createFetchRequestForApi,
  RequestHeaderProducer,
  RequestHeaders
} from "italia-ts-commons/lib/requests";
import { Omit } from "italia-ts-commons/lib/types";
import { defaultRetryingFetch } from "../../../../utils/fetch";
import {
  getMerchantDefaultDecoder,
  GetMerchantT,
  getOfflineMerchantsDefaultDecoder,
  GetOfflineMerchantsT,
  getOnlineMerchantsDefaultDecoder,
  GetOnlineMerchantsT
} from "../../../../../definitions/cgn/merchants/requestTypes";

const tokenHeaderProducer = ParamAuthorizationBearerHeaderProducer();

const BASE_URL = "/api/v1/cgn-operator-search";

const getOnlineMerchants: GetOnlineMerchantsT = {
  method: "post",
  url: () => `${BASE_URL}/online-merchants`,
  query: _ => ({}),
  body: ({ onlineMerchantSearchRequest }) =>
    JSON.stringify(onlineMerchantSearchRequest),
  headers: composeHeaderProducers(tokenHeaderProducer, ApiHeaderJson),
  response_decoder: getOnlineMerchantsDefaultDecoder()
};

const getOfflineMerchants: GetOfflineMerchantsT = {
  method: "post",
  url: () => `${BASE_URL}/offline-merchants`,
  query: _ => ({}),
  body: ({ offlineMerchantSearchRequest }) =>
    JSON.stringify(offlineMerchantSearchRequest),
  headers: composeHeaderProducers(tokenHeaderProducer, ApiHeaderJson),
  response_decoder: getOfflineMerchantsDefaultDecoder()
};

const getMerchant: GetMerchantT = {
  method: "get",
  url: params => `${BASE_URL}/merchants/${params.merchantId}`,
  query: _ => ({}),
  headers: composeHeaderProducers(tokenHeaderProducer, ApiHeaderJson),
  response_decoder: getMerchantDefaultDecoder()
};

function ParamAuthorizationBearerHeaderProducer<
  P extends { readonly Bearer: string }
>(): RequestHeaderProducer<P, "Authorization"> {
  return (p: P): RequestHeaders<"Authorization"> => ({
    Authorization: `Bearer ${p.Bearer}`
  });
}

//
// A specific backend client to handle cgn requests
//
export function BackendCgnMerchants(
  baseUrl: string,
  token: string,
  fetchApi: typeof fetch = defaultRetryingFetch()
) {
  const options = {
    baseUrl,
    fetchApi
  };

  // withBearerToken injects the field 'Bearer' with value token into the parameter P
  // of the f function
  const withBearerToken = <P extends { Bearer: string }, R>(
    f: (p: P) => Promise<R>
  ) => async (po: Omit<P, "Bearer">): Promise<R> => {
    const params = Object.assign({ Bearer: String(token) }, po) as P;
    return f(params);
  };

  return {
    getOnlineMerchants: withBearerToken(
      createFetchRequestForApi(getOnlineMerchants, options)
    ),
    getOfflineMerchants: withBearerToken(
      createFetchRequestForApi(getOfflineMerchants, options)
    ),
    getMerchant: withBearerToken(createFetchRequestForApi(getMerchant, options))
  };
}
