import { SagaIterator } from "redux-saga";
import { takeEvery, takeLatest } from "redux-saga/effects";
import { getType } from "typesafe-actions";
import {
  cgnActivationStart,
  cgnRequestActivation
} from "../store/actions/activation";
import { apiUrlPrefix } from "../../../../config";
import { BackendCGN } from "../api/backendCgn";
import { handleCgnStartActivationSaga } from "./orchestration/activation/activationSaga";
import { handleCgnActivationSaga } from "./orchestration/activation/handleActivationSaga";
import {
  cgnActivationSaga,
  handleCgnStatusPolling
} from "./networking/activation/getBonusActivationSaga";

export function* watchBonusCgnSaga(bearerToken: string): SagaIterator {
  // create client to exchange data with the APIs
  const backendCGN = BackendCGN(apiUrlPrefix, bearerToken);

  // CGN Activation request with status polling
  yield takeLatest(
    getType(cgnRequestActivation.request),
    handleCgnActivationSaga,
    cgnActivationSaga(
      backendCGN.startCgnActivation,
      handleCgnStatusPolling(backendCGN.getCgnStatus)
    )
  );

  // CGN Activation workflow
  yield takeEvery(getType(cgnActivationStart), handleCgnStartActivationSaga);
}
