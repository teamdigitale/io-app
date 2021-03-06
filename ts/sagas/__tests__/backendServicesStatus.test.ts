import { right } from "fp-ts/lib/Either";
import { expectSaga } from "redux-saga-test-plan";
import * as matchers from "redux-saga-test-plan/matchers";

import { backendStatusLoadSuccess } from "../../store/actions/backendStatus";
import { backendStatusSaga } from "../backendStatus";
import { BackendStatus } from "../../../definitions/content/BackendStatus";
import { baseRawBackendStatus } from "../../store/reducers/__mock__/backendStatus";

jest.mock("react-native-background-timer", () => ({
  BackgroundTimer: { setTimeout: jest.fn }
}));

const responseOn: BackendStatus = {
  ...baseRawBackendStatus,
  is_alive: true,
  message: {
    "it-IT": "messaggio in italiano",
    "en-EN": "english message"
  }
};

describe("backendServicesStatusSaga", () => {
  it("should emit the services status on backend response", () => {
    const getBackendServicesStatus = jest.fn();
    return expectSaga(backendStatusSaga, getBackendServicesStatus)
      .provide([
        [
          matchers.call.fn(getBackendServicesStatus),
          right({ status: 200, value: responseOn })
        ]
      ])
      .put(backendStatusLoadSuccess(responseOn))
      .run();
  });

  it("shouldn't emit the services status on backend response status !== 200", () => {
    const getBackendServicesStatus = jest.fn();
    return expectSaga(backendStatusSaga, getBackendServicesStatus)
      .provide([
        [
          matchers.call.fn(getBackendServicesStatus),
          right({ status: 404, value: responseOn })
        ]
      ])
      .not.put(backendStatusLoadSuccess(responseOn))
      .run();
  });

  it("shouldn't emit the services status on backend response failure", () => {
    const getBackendServicesStatus = jest.fn(() => {
      throw new Error("network error");
    });
    return expectSaga(backendStatusSaga, getBackendServicesStatus)
      .not.put(backendStatusLoadSuccess(responseOn))
      .run();
  });
});
