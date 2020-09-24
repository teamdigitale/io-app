import { Option } from "fp-ts/lib/Option";
import * as pot from "italia-ts-commons/lib/pot";
import { CreatedMessageWithContent } from "../../../definitions/backend/CreatedMessageWithContent";
import { FiscalCode } from "../../../definitions/backend/FiscalCode";
import { MessageBodyMarkdown } from "../../../definitions/backend/MessageBodyMarkdown";
import { MessageContent } from "../../../definitions/backend/MessageContent";
import { Locales } from "../../../locales/locales";
import { setLocale } from "../../i18n";
import { CTA, CTAS } from "../../types/MessageCTA";
import {
  cleanMarkdownFromCTAs,
  getCTA,
  isCtaActionValid,
  MaybePotMetadata
} from "../messages";

const messageBody = `### this is a message

this is a body`;

const CTA_2 =
  `---
it:
    cta_1: 
        text: "premi"
        action: "ioit://PROFILE_MAIN"
    cta_2: 
        text: "premi2"
        action: "ioit://PROFILE_MAIN2"
en:
    cta_1: 
        text: "go1"
        action: "ioit://PROFILE_MAIN"
    cta_2: 
        text: "go2"
        action: "ioit://PROFILE_MAIN2"
---
` + messageBody;

const messageWithContent = {
  created_at: new Date(),
  fiscal_code: "RSSMRA83A12H501D" as FiscalCode,
  id: "93726BD8-D29C-48F2-AE6D-2F",
  sender_service_id: "dev-service_0",
  time_to_live: 3600,
  content: {
    subject: "Subject - test 1",
    markdown: CTA_2,
    due_date: new Date(),
    payment_data: {
      notice_number: "012345678912345678",
      amount: 406,
      invalid_after_due_date: false
    }
  } as MessageContent
} as CreatedMessageWithContent;

const serviceMetadataBase = {
  description: "demo demo <br/>demo demo <br/>demo demo <br/>demo demo <br/>",
  scope: "LOCAL",
  address: "Piazza di Spagna, Roma, Italia",
  email: "mock.service@email.com",
  pec: "mock.pec@email.com",
  phone: "5555555",
  web_url: "https://www.google.com",
  app_android: "https://www.google.com",
  app_ios: "https://www.google.com",
  support_url: "https://www.sos.com",
  tos_url: "https://www.tos.com",
  privacy_url: "https://www.privacy.com",
  cta: `--- it: cta_1: text: "Richiedi" action: "ioit://SERVICE_WEBVIEW?url=http://192.168.1.10:3000/myportal_playground.html" en: cta_1: text: "Request" action: "ioit://SERVICE_WEBVIEW?url=http://192.168.1.10:3000/myportal_playground.html" ---`
};

const CTA_WEBVIEW =
  `---
it:
    cta_1: 
        text: "premi"
        action: "ioit://SERVICE_WEBVIEW"
en:
    cta_1: 
        text: "go1"
        action: "ioit://SERVICE_WEBVIEW"
---
` + messageBody;

// test "it" as default language
beforeAll(() => setLocale("it" as Locales));

describe("getCTA", () => {
  it("should have 2 valid CTA", () => {
    const maybeCTAs = getCTA(messageWithContent);
    test2CTA(
      maybeCTAs,
      "premi",
      "ioit://PROFILE_MAIN",
      "premi2",
      "ioit://PROFILE_MAIN2"
    );
    setLocale("en" as Locales);
    const maybeCTAsEn = getCTA(messageWithContent);
    test2CTA(
      maybeCTAsEn,
      "go1",
      "ioit://PROFILE_MAIN",
      "go2",
      "ioit://PROFILE_MAIN2"
    );
  });

  it("should return the english CTA when the language is not supported", () => {
    setLocale("fr" as Locales);
    const maybeCTAs = getCTA(messageWithContent);
    test2CTA(
      maybeCTAs,
      "go1",
      "ioit://PROFILE_MAIN",
      "go2",
      "ioit://PROFILE_MAIN2"
    );
    setLocale("it" as Locales); // restore default
  });

  it("should not have valid CTA (action is malformed)", () => {
    const CTA_1 = `---
it:
    cta_1:
        text: "premi"
        action: "io://PROFILE_MAIN"
--- 
some noise`;

    const maybeCTA = getCTA({
      ...messageWithContent,
      content: {
        ...messageWithContent.content,
        markdown: CTA_1 as MessageBodyMarkdown
      }
    });
    expect(maybeCTA.isNone());
  });

  it("should not have a valid CTA", () => {
    const maybeCTA = getCTA({
      ...messageWithContent,
      content: {
        ...messageWithContent.content,
        markdown: "nothing of nothing" as MessageBodyMarkdown
      }
    });
    expect(maybeCTA.isNone()).toBeTruthy();
  });

  it("should not have a valid CTA", () => {
    const NO_CTA = `---
it:
    act_1:
        txet: "premi"
        aa: "ioit://PROFILE_MAIN"
--- 
some noise`;
    const maybeCTA = getCTA({
      ...messageWithContent,
      content: {
        ...messageWithContent.content,
        markdown: NO_CTA as MessageBodyMarkdown
      }
    });
    expect(maybeCTA.isNone()).toBeTruthy();
  });

  it("should have a valid CTA for service", () => {
    const validServiceMetadata = pot.some({
      ...serviceMetadataBase,
      token_name: "asdfer"
    });
    const maybeCTAs = getCTA(
      {
        ...messageWithContent,
        content: {
          ...messageWithContent.content,
          markdown: CTA_WEBVIEW as MessageBodyMarkdown
        }
      },
      validServiceMetadata as MaybePotMetadata
    );
    expect(maybeCTAs.isSome()).toBeTruthy();
    if (maybeCTAs.isSome()) {
      expect(maybeCTAs.value.cta_1).toBeDefined();
      expect(maybeCTAs.value.cta_1.text).toEqual("go1");
      expect(maybeCTAs.value.cta_1.action).toEqual("ioit://SERVICE_WEBVIEW");
    }
  });
});

const test2CTA = (
  maybeCTAS: Option<CTAS>,
  text1: string,
  action1: string,
  text2: string,
  action2: string
) => {
  expect(maybeCTAS.isSome()).toBeTruthy();
  if (maybeCTAS.isSome()) {
    const ctas = maybeCTAS.value;
    expect(ctas.cta_1).toBeDefined();
    expect(ctas.cta_2).toBeDefined();
    expect(ctas.cta_1.text).toEqual(text1);
    expect(ctas.cta_1.action).toEqual(action1);
    if (ctas.cta_2) {
      expect(ctas.cta_2.text).toEqual(text2);
      expect(ctas.cta_2.action).toEqual(action2);
    }
  }
};

describe("isCtaActionValid", () => {
  it("should be a valid internal navigation action", async () => {
    const valid: CTA = { text: "dummy", action: "ioit://PROFILE_MAIN" };
    const isValid = isCtaActionValid(valid);
    expect(isValid).toBeTruthy();
  });

  it("should be not valid (wrong protocol)", async () => {
    const invalidProtocol: CTA = {
      text: "dummy",
      action: "iosit://PROFILE_MAIN"
    };
    const isValid = isCtaActionValid(invalidProtocol);
    expect(isValid).toBeFalsy();
  });

  it("should be not valid (wrong route)", async () => {
    const invalidRoute: CTA = { text: "dummy", action: "iosit://WRONG_ROUTE" };
    const isValid = isCtaActionValid(invalidRoute);
    expect(isValid).toBeFalsy();
  });

  it("should be a valid RN Linking", async () => {
    const phoneCtaValid: CTA = {
      text: "dummy",
      action: "iohandledlink://tel://3471615647"
    };
    const isValid = isCtaActionValid(phoneCtaValid);
    expect(isValid).toBeTruthy();
  });

  it("should be a valid RN Linking (web)", async () => {
    const webCtaValid: CTA = {
      text: "dummy",
      action: "iohandledlink://https://www.google.it"
    };
    const isValid = isCtaActionValid(webCtaValid);
    expect(isValid).toBeTruthy();
  });
});

describe("cleanMarkdownFromCTAs", () => {
  it("should be the same", async () => {
    const markdown = "simple text";
    const cleaned = cleanMarkdownFromCTAs(markdown as MessageBodyMarkdown);
    expect(cleaned).toEqual(markdown);
  });

  it("should be cleaned", async () => {
    const withCTA = `---
it:
    cta_1:
        text: "premi"
        action: "io://PROFILE_MAIN"
--- 
some noise`;
    const cleaned = cleanMarkdownFromCTAs(withCTA as MessageBodyMarkdown);
    expect(cleaned).toEqual("some noise");
  });

  it("should be cleaned (extended version)", async () => {
    const cleaned = cleanMarkdownFromCTAs(CTA_2 as MessageBodyMarkdown);
    expect(cleaned).toEqual(messageBody);
  });
});
