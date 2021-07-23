import { getType } from "typesafe-actions";
import {
  remoteError,
  remoteLoading,
  remoteReady,
  remoteUndefined,
  RemoteValue
} from "../../../bpd/model/RemoteValue";
import { AutocompleteResultItem } from "../../../../../../definitions/cgn/geo/AutocompleteResultItem";
import { NetworkError } from "../../../../../utils/errors";
import { LookupResponse } from "../../../../../../definitions/cgn/geo/LookupResponse";
import { Action } from "../../../../../store/actions/types";
import { cgnAutocompleteSearch, cgnGeocoding } from "../actions/geocoding";

export type GeocodingState = {
  autocompleteSuggestions: RemoteValue<
    ReadonlyArray<AutocompleteResultItem>,
    NetworkError
  >;
  geocodingResult: RemoteValue<LookupResponse, NetworkError>;
};

const initialState: GeocodingState = {
  autocompleteSuggestions: remoteUndefined,
  geocodingResult: remoteUndefined
};

const reducer = (
  state: GeocodingState = initialState,
  action: Action
): GeocodingState => {
  switch (action.type) {
    // Autocomplete
    case getType(cgnAutocompleteSearch.request):
      return {
        ...state,
        autocompleteSuggestions: remoteLoading
      };
    case getType(cgnAutocompleteSearch.success):
      return {
        ...state,
        autocompleteSuggestions: remoteReady(action.payload)
      };
    case getType(cgnAutocompleteSearch.failure):
      return {
        ...state,
        autocompleteSuggestions: remoteError(action.payload)
      };
    // Geocoding
    case getType(cgnGeocoding.request):
      return {
        ...state,
        geocodingResult: remoteLoading
      };
    case getType(cgnGeocoding.success):
      return {
        ...state,
        geocodingResult: remoteReady(action.payload)
      };
    case getType(cgnGeocoding.failure):
      return {
        ...state,
        geocodingResult: remoteError(action.payload)
      };
  }
  return state;
};

export default reducer;
