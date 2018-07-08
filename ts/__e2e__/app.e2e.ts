// tslint:disable:no-commented-code

// FIXME: putting these declarations in detox.d.ts makes them available in all
// test modules clashing with Jest's expect
declare const device: Detox.Device;
declare const element: Detox.Element;
declare const waitFor: Detox.WaitFor;
declare const expect: Detox.Expect<Detox.Expect<any>>;
declare const by: Detox.Matchers;

import * as detox from "detox";
import adapter from "detox/runners/jest/adapter";

const config = require("package.json").detox;

// Set the default test timeout (in milliseconds)
jest.setTimeout(5 * 60 * 1000);
(jasmine as any).getEnv().addReporter(adapter);

beforeAll(async () => {
  await detox.init(config, { launchApp: false });
});

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});

describe("e2e app", () => {
  it("should display SPID login button", async () => {
    await device.launchApp({ permissions: { notifications: "YES" } });
    await device.reloadReactNative();

    const loginButtonId = "landing-button-login";
    await waitFor(element(by.id(loginButtonId)))
      .toBeVisible()
      .withTimeout(20000);
    // await expect(element(by.id(loginButtonId))).toBeVisible();

    await element(by.id(loginButtonId)).tap();
    await expect(element(by.id("idps-grid"))).toBeVisible();
  });
});
