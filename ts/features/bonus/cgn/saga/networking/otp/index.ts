import { call, put } from "redux-saga/effects";
import { BackendCGN } from "../../../api/backendCgn";
import { SagaCallReturnType } from "../../../../../../types/utils";
import { getNetworkError } from "../../../../../../utils/errors";
import { cngGenerateOtp } from "../../../store/actions/otp";
import { readablePrivacyReport } from "../../../../../../utils/reporters";

// handle the request for CGN Otp code generation
export function* cgnGenerateOtp(
  generateOtp: ReturnType<typeof BackendCGN>["generateOtp"]
) {
  try {
    const generateOtpResult: SagaCallReturnType<typeof generateOtp> = yield call(
      generateOtp,
      {}
    );
    if (generateOtpResult.isRight()) {
      if (generateOtpResult.value.status === 200) {
        yield put(cngGenerateOtp.success(generateOtpResult.value.value));
      } else {
        yield put(
          cngGenerateOtp.failure(
            getNetworkError(
              new Error(`response status ${generateOtpResult.value.status}`)
            )
          )
        );
      }
    } else {
      yield put(
        cngGenerateOtp.failure(
          getNetworkError(
            new Error(readablePrivacyReport(generateOtpResult.value))
          )
        )
      );
    }
  } catch (e) {
    yield put(cngGenerateOtp.failure(getNetworkError(e)));
  }
}
