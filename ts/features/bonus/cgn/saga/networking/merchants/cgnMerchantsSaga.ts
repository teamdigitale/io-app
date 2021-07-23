import { call, put } from "redux-saga/effects";
import { readableReport } from "italia-ts-commons/lib/reporters";
import { BackendCgnMerchants } from "../../../api/backendCgnMerchants";
import { SagaCallReturnType } from "../../../../../../types/utils";
import {
  cgnOfflineMerchants,
  cgnOnlineMerchants,
  cgnSelectedMerchant
} from "../../../store/actions/merchants";
import { getNetworkError } from "../../../../../../utils/errors";

export function* cgnOnlineMerchantsSaga(
  getOnlineMerchants: ReturnType<
    typeof BackendCgnMerchants
  >["getOnlineMerchants"],
  cgnOnlineMerchantRequest: ReturnType<typeof cgnOnlineMerchants.request>
) {
  try {
    const onlineMerchantsResult: SagaCallReturnType<typeof getOnlineMerchants> = yield call(
      getOnlineMerchants,
      {
        onlineMerchantSearchRequest: cgnOnlineMerchantRequest.payload
      }
    );

    if (onlineMerchantsResult.isLeft()) {
      yield put(
        cgnOnlineMerchants.failure({
          kind: "generic",
          value: new Error(readableReport(onlineMerchantsResult.value))
        })
      );
      return;
    }

    if (onlineMerchantsResult.value.status === 200) {
      yield put(
        cgnOnlineMerchants.success(onlineMerchantsResult.value.value.items)
      );
      return;
    }

    throw new Error(`Response in status ${onlineMerchantsResult.value.status}`);
  } catch (e) {
    yield put(cgnOnlineMerchants.failure(getNetworkError(e)));
  }
}

export function* cgnOfflineMerchantsSaga(
  getOfflineMerchants: ReturnType<
    typeof BackendCgnMerchants
  >["getOfflineMerchants"],
  cgnOfflineMerchantRequest: ReturnType<typeof cgnOfflineMerchants.request>
) {
  try {
    const offlineMerchantsResult: SagaCallReturnType<typeof getOfflineMerchants> = yield call(
      getOfflineMerchants,
      {
        offlineMerchantSearchRequest: cgnOfflineMerchantRequest.payload
      }
    );

    if (offlineMerchantsResult.isLeft()) {
      yield put(
        cgnOfflineMerchants.failure({
          kind: "generic",
          value: new Error(readableReport(offlineMerchantsResult.value))
        })
      );
      return;
    }

    if (offlineMerchantsResult.value.status === 200) {
      yield put(
        cgnOfflineMerchants.success(offlineMerchantsResult.value.value.items)
      );
      return;
    }

    throw new Error(
      `Response in status ${offlineMerchantsResult.value.status}`
    );
  } catch (e) {
    yield put(cgnOfflineMerchants.failure(getNetworkError(e)));
  }
}

export function* cgnMerchantDetail(
  getMerchant: ReturnType<typeof BackendCgnMerchants>["getMerchant"],
  merchantSelected: ReturnType<typeof cgnSelectedMerchant["request"]>
) {
  try {
    const merchantDetailResult: SagaCallReturnType<typeof getMerchant> = yield call(
      getMerchant,
      { merchantId: merchantSelected.payload }
    );
    if (merchantDetailResult.isLeft()) {
      yield put(
        cgnSelectedMerchant.failure({
          kind: "generic",
          value: new Error(readableReport(merchantDetailResult.value))
        })
      );
      return;
    }

    if (merchantDetailResult.value.status === 200) {
      yield put(cgnSelectedMerchant.success(merchantDetailResult.value.value));
      return;
    }

    throw new Error(`Response in status ${merchantDetailResult.value.status}`);
  } catch (e) {
    yield put(cgnSelectedMerchant.failure(getNetworkError(e)));
  }
}
