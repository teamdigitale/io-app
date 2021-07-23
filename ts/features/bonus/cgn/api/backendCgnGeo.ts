import {
  ApiHeaderJson,
  composeHeaderProducers,
  createFetchRequestForApi,
  RequestHeaderProducer,
  RequestHeaders
} from "italia-ts-commons/lib/requests";
import { defaultRetryingFetch } from "../../../../utils/fetch";
import { withBearerToken as withToken } from "../../../../utils/api";
import {
  autocompleteDefaultDecoder,
  AutocompleteT,
  lookupDefaultDecoder,
  LookupT
} from "../../../../../definitions/cgn/geo/requestTypes";

const tokenHeaderProducer = ParamAuthorizationBearerHeaderProducer();

const BASE_URL = "/api/v1/geo";

const autocompleteAddress: AutocompleteT = {
  method: "get",
  url: params =>
    `${BASE_URL}/autocomplete?queryAddress=${params.queryAddress}&limit=${params.limitAutocomplete}`,
  query: () => ({}),
  headers: composeHeaderProducers(tokenHeaderProducer, ApiHeaderJson),
  response_decoder: autocompleteDefaultDecoder()
};

const lookupAddress: LookupT = {
  method: "get",
  url: params => `${BASE_URL}/lookup?id=${params.lookupId}`,
  query: () => ({}),
  headers: composeHeaderProducers(tokenHeaderProducer, ApiHeaderJson),
  response_decoder: lookupDefaultDecoder()
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
export function BackendCGNGeo(
  baseUrl: string,
  token: string,
  fetchApi: typeof fetch = defaultRetryingFetch()
) {
  const options = {
    baseUrl,
    fetchApi
  };
  const withBearerToken = withToken(token);
  return {
    autocomplete: withBearerToken(
      createFetchRequestForApi(autocompleteAddress, options)
    ),
    lookup: withBearerToken(createFetchRequestForApi(lookupAddress, options))
  };
}
