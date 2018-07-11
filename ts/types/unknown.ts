import { EnteBeneficiario } from "../../definitions/pagopa-proxy/EnteBeneficiario";
import { Wallet } from "../../definitions/pagopa/Wallet";
import {
  PaymentNoticeNumber,
  RptId
} from "../../node_modules/italia-ts-commons/lib/pagopa";
import { OrganizationFiscalCode } from "../../node_modules/italia-ts-commons/lib/strings";

export const UNKNOWN_RECIPIENT: EnteBeneficiario = {
  identificativoUnivocoBeneficiario: "?",
  denominazioneBeneficiario: "?",
  codiceUnitOperBeneficiario: "?",
  denomUnitOperBeneficiario: "?",
  indirizzoBeneficiario: "?",
  civicoBeneficiario: "?",
  capBeneficiario: "?",
  localitaBeneficiario: "?",
  provinciaBeneficiario: "?",
  nazioneBeneficiario: "?"
};

export const UNKNOWN_ORGANIZATION_FISCAL_CODE = "00000000000" as OrganizationFiscalCode;

export const UNKNOWN_PAYMENT_NOTICE_NUMBER = {
  auxDigit: "0",
  applicationCode: "00",
  iuv13: "0000000000000"
} as PaymentNoticeNumber;

export const UNKNOWN_RPTID: RptId = {
  organizationFiscalCode: UNKNOWN_ORGANIZATION_FISCAL_CODE,
  paymentNoticeNumber: UNKNOWN_PAYMENT_NOTICE_NUMBER
};

export const UNKNOWN_CARD_PAN = "0000";
export const UNKNOWN_CARD_HOLDER = "NO HOLDER";

export const UNKNOWN_CARD: Wallet = {
  creditCard: {
    brandLogo: "UNKNOWN",
    expireMonth: "00",
    expireYear: "00",
    flag3dsVerified: false,
    holder: UNKNOWN_CARD_HOLDER,
    id: -1,
    pan: UNKNOWN_CARD_PAN
  },
  favourite: false,
  idPsp: -1,
  id: -1,
  lastUsage: "???",
  psp: {
    businessName: "None",
    fixedCost: {
      amount: 0,
      currency: "EUR",
      decimalDigits: 2
    }
  }
};
