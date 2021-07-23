import { none, Option, some } from "fp-ts/lib/Option";
import { extractLoginResult, getIntentFallbackUrl } from "../login";

describe("hook the login outcome from the url", () => {
  const remoteHost = "https://somedomain.com/somepath/";
  const successSuffix = "/profile.html?token=";
  const successToken = "ABCDFG0123456";
  const success = remoteHost + successSuffix + successToken;
  const loginResult = extractLoginResult(success);

  // success
  it("should be NOT undefined", () => {
    expect(loginResult).not.toBeUndefined();
  });
  if (loginResult !== undefined) {
    it("should be success TRUE", () => {
      expect(loginResult.success).toBeTruthy();
    });
    if (loginResult.success) {
      it("should extract token correctly", () => {
        expect(loginResult.token).toEqual(successToken);
      });
    }
  }

  // no login hooks
  const loginResultUndefined = extractLoginResult(
    "https://somedomain.com/path1/path2/index.html?id=12345"
  );
  it("login result should be undefined", () => {
    expect(loginResultUndefined).toBeUndefined();
  });

  // failure
  const failureSuffix = "/error.html";
  const errorCode = "123456";
  const failureSuffixWithCode = "/error.html?errorCode=";
  const failureNoCode = remoteHost + failureSuffix;
  const failureWithCode = remoteHost + failureSuffixWithCode + errorCode;

  // failure with no code
  const loginFailureNoCode = extractLoginResult(failureNoCode);
  it("should be not undefined", () => {
    expect(loginFailureNoCode).not.toBeUndefined();
  });
  if (loginFailureNoCode !== undefined) {
    it("should be success FALSE", () => {
      expect(loginFailureNoCode.success).toBeFalsy();
    });
    if (!loginFailureNoCode.success) {
      it("login failure should be undefined", () => {
        expect(loginFailureNoCode.errorCode).toBeUndefined();
      });
    }
  }

  // failure with code
  const loginFailureWithCode = extractLoginResult(failureWithCode);
  it("should be not undefined", () => {
    expect(loginFailureWithCode).not.toBeUndefined();
  });
  if (loginFailureWithCode !== undefined) {
    it("should be success FALSE", () => {
      expect(loginFailureWithCode.success).toBeFalsy();
    });
    if (!loginFailureWithCode.success) {
      it("should be undefined", () => {
        expect(loginFailureWithCode.errorCode).toEqual(errorCode);
      });
    }
  }
});

describe("getIntentFallbackUrl", () => {
  const isIntentSchemeCases: ReadonlyArray<[string, Option<string>]> = [
    ["", none],
    ["https://www.google.com", none],
    ["intent:", none],
    ["intent://", none],
    [
      "intent://domain.test.it/?tranId=abc#Intent;scheme=https;package=com.test.it;S.browser_fallback_url=https://domain.it/?tranId=acb;end",
      some("https://domain.it/?tranId=acb")
    ],
    [
      "intent://domain.test.it/?tranId=abc#Intent;scheme=https;package=com.test.it;S.browser_fallback_url=https://domain.it/?tranId=acb",
      none
    ],
    [
      "intent://domain.test.it/?tranId=abc#Intent;scheme=https;package=com.test.it;end",
      none
    ],
    [
      "intent://domain.test.it/?tranId=abc#Intent;scheme=https;package=com.test.it;fallback_url=https://domain.it/?tranId=acb;end",
      none
    ]
  ];
  test.each(isIntentSchemeCases)(
    "given %p as argument, returns %p",
    (firstArg, expectedResult) => {
      const result = getIntentFallbackUrl(firstArg);
      expect(result).toEqual(expectedResult);
    }
  );
});
