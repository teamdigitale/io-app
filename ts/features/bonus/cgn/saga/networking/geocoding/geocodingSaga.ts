import { call, put } from "redux-saga/effects";
import { readableReport } from "italia-ts-commons/lib/reporters";
import { BackendCGNGeo } from "../../../api/backendCgnGeo";
import { SagaCallReturnType } from "../../../../../../types/utils";
import {
  cgnAutocompleteSearch,
  cgnGeocoding
} from "../../../store/actions/geocoding";
import { getNetworkError } from "../../../../../../utils/errors";

const AUTCOMPLETE_LIMIT = 5;

export function* autocompleteSaga(
  autocomplete: ReturnType<typeof BackendCGNGeo>["autocomplete"],
  autocompleteRequest: ReturnType<typeof cgnAutocompleteSearch.request>
) {
  try {
    const autocompleteResponse: SagaCallReturnType<typeof autocomplete> = yield call(
      autocomplete,
      {
        queryAddress: autocompleteRequest.payload,
        limitAutocomplete: AUTCOMPLETE_LIMIT
      }
    );

    if (autocompleteResponse.isLeft()) {
      yield put(
        cgnAutocompleteSearch.failure({
          kind: "generic",
          value: new Error(readableReport(autocompleteResponse.value))
        })
      );
      return;
    }

    if (autocompleteResponse.value.status === 200) {
      yield put(
        cgnAutocompleteSearch.success(autocompleteResponse.value.value.items)
      );
      return;
    }

    throw new Error(`Response in status ${autocompleteResponse.value.status}`);
  } catch (e) {
    yield put(cgnAutocompleteSearch.failure(getNetworkError(e)));
  }
}

export function* geocodingSaga(
  lookup: ReturnType<typeof BackendCGNGeo>["lookup"],
  geocodingRequest: ReturnType<typeof cgnGeocoding.request>
) {
  try {
    const geocodingResponse: SagaCallReturnType<typeof lookup> = yield call(
      lookup,
      {
        lookupId: geocodingRequest.payload
      }
    );

    if (geocodingResponse.isLeft()) {
      yield put(
        cgnGeocoding.failure({
          kind: "generic",
          value: new Error(readableReport(geocodingResponse.value))
        })
      );
      return;
    }

    if (geocodingResponse.value.status === 200) {
      yield put(cgnGeocoding.success(geocodingResponse.value.value));
      return;
    }

    throw new Error(`Response in status ${geocodingResponse.value.status}`);
  } catch (e) {
    yield put(cgnGeocoding.failure(getNetworkError(e)));
  }
}
