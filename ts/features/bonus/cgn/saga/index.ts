import { SagaIterator } from "redux-saga";
import { takeLatest } from "redux-saga/effects";
import { getType } from "typesafe-actions";
import {
  cgnActivationStart,
  cgnRequestActivation
} from "../store/actions/activation";
import { apiUrlPrefix } from "../../../../config";
import { BackendCGN } from "../api/backendCgn";
import { cgnDetails } from "../store/actions/details";
import { cgnEycaStatus } from "../store/actions/eyca/details";
import { cgnGenerateOtp as cgnGenerateOtpAction } from "../store/actions/otp";
import {
  cgnEycaActivation,
  cgnEycaActivationStatusRequest
} from "../store/actions/eyca/activation";
import {
  cgnOfflineMerchants,
  cgnOnlineMerchants,
  cgnSelectedMerchant
} from "../store/actions/merchants";
import { BackendCgnMerchants } from "../api/backendCgnMerchants";
import { handleCgnStartActivationSaga } from "./orchestration/activation/activationSaga";
import { handleCgnActivationSaga } from "./orchestration/activation/handleActivationSaga";
import {
  cgnActivationSaga,
  handleCgnStatusPolling
} from "./networking/activation/getBonusActivationSaga";
import { cgnGetInformationSaga } from "./networking/details/getCgnInformationSaga";
import { handleGetEycaStatus } from "./networking/eyca/details/getEycaStatus";
import { cgnGenerateOtp } from "./networking/otp";
import { getEycaActivationStatusSaga } from "./networking/eyca/activation/getEycaActivationStatus";
import { eycaActivationSaga } from "./orchestration/eyca/eycaActivationSaga";
import {
  cgnMerchantDetail,
  cgnOfflineMerchantsSaga,
  cgnOnlineMerchantsSaga
} from "./networking/merchants/cgnMerchantsSaga";

export function* watchBonusCgnSaga(bearerToken: string): SagaIterator {
  // create client to exchange data with the APIs
  const backendCGN = BackendCGN(apiUrlPrefix, bearerToken);
  const backendCgnMerchants = BackendCgnMerchants(apiUrlPrefix, bearerToken);

  // CGN Activation request with status polling
  yield takeLatest(
    getType(cgnRequestActivation),
    handleCgnActivationSaga,
    cgnActivationSaga(
      backendCGN.startCgnActivation,
      handleCgnStatusPolling(backendCGN.getCgnActivation)
    )
  );

  // CGN Activation workflow
  yield takeLatest(getType(cgnActivationStart), handleCgnStartActivationSaga);

  // CGN Load details
  yield takeLatest(
    getType(cgnDetails.request),
    cgnGetInformationSaga,
    backendCGN.getCgnStatus
  );

  // Eyca get status
  yield takeLatest(
    getType(cgnEycaStatus.request),
    handleGetEycaStatus,
    backendCGN.getEycaStatus
  );

  // Eyca Activation
  yield takeLatest(
    getType(cgnEycaActivation.request),
    eycaActivationSaga,
    backendCGN.getEycaActivation,
    backendCGN.startEycaActivation
  );

  // Eyca Activation Status
  yield takeLatest(
    getType(cgnEycaActivationStatusRequest),
    getEycaActivationStatusSaga,
    backendCGN.getEycaActivation
  );

  // CGN Otp generation
  yield takeLatest(
    getType(cgnGenerateOtpAction.request),
    cgnGenerateOtp,
    backendCGN.generateOtp
  );

  // CGN Offline Merchants
  yield takeLatest(
    getType(cgnOfflineMerchants.request),
    cgnOfflineMerchantsSaga,
    backendCgnMerchants.getOfflineMerchants
  );

  // CGN Online Merchants
  yield takeLatest(
    getType(cgnOnlineMerchants.request),
    cgnOnlineMerchantsSaga,
    backendCgnMerchants.getOnlineMerchants
  );

  // CGN get selected Merchant detail
  yield takeLatest(
    getType(cgnSelectedMerchant.request),
    cgnMerchantDetail,
    backendCgnMerchants.getMerchant
  );
}
