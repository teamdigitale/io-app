import { IUnitTag } from "italia-ts-commons/lib/units";

/**
 * The unique ID of a EU Covid Certificate
 */
type EUCovidCertificateId = string & IUnitTag<"EUCovidCertificateId">;

/**
 * The auth code used to request the EU Covid Certificate, received via message
 */
export type EUCovidCertificateAuthCode = string &
  IUnitTag<"EUCovidCertificateAuthCode">;

type WithEUCovidCertificateId<T> = T & {
  id: EUCovidCertificateId;
};

type QRCode = {
  mimeType: "image/png" | "image/svg";
  content: string;
};

type ValidCertificate = {
  kind: "valid";
  qrCode: QRCode;
  markdownPreview?: string;
  markdownDetails?: string;
};

type RevokedCertificate = {
  kind: "revoked";
  revokeInfo?: string;
  revokedOn?: Date;
};

type ExpiredCertificate = {
  kind: "expired";
  expiredInfo?: string;
};

/**
 * This type represents the EU Covid Certificate with the different states & data
 */
export type EUCovidCertificate = WithEUCovidCertificateId<
  ValidCertificate | RevokedCertificate | ExpiredCertificate
>;
