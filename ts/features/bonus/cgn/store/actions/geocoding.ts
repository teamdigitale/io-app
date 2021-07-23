import { ActionType, createAsyncAction } from "typesafe-actions";
import { NetworkError } from "../../../../../utils/errors";
import { AutocompleteResultItem } from "../../../../../../definitions/cgn/geo/AutocompleteResultItem";
import { LookupResponse } from "../../../../../../definitions/cgn/geo/LookupResponse";

/**
 * get and handle list of merchants conventioned with CGN
 */
export const cgnAutocompleteSearch = createAsyncAction(
  "CGN_AUTOCOMPLETE_REQUEST",
  "CGN_AUTOCOMPLETE_SUCCESS",
  "CGN_AUTOCOMPLETE_FAILURE"
)<string, ReadonlyArray<AutocompleteResultItem>, NetworkError>();

export const cgnGeocoding = createAsyncAction(
  "CGN_GEOCODING_REQUEST",
  "CGN_GEOCODING_SUCCESS",
  "CGN_GEOCODING_FAILURE"
)<string, LookupResponse, NetworkError>();

export type CgnGeocodingAction =
  | ActionType<typeof cgnAutocompleteSearch>
  | ActionType<typeof cgnGeocoding>;
