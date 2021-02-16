import { render } from "@testing-library/react-native";
import * as React from "react";
import { Card } from "../../../../../../../definitions/cgn/Card";
import { StatusEnum as CgnActivatedStatusEnum } from "../../../../../../../definitions/cgn/CardActivated";
import TypedI18n from "../../../../../../i18n";
import { localeDateFormat } from "../../../../../../utils/locale";
import {
  CardRevoked,
  StatusEnum as CgnRevokedStatusEnum
} from "../../../../../../../definitions/cgn/CardRevoked";
import { StatusEnum as CgnExpiredStatusEnum } from "../../../../../../../definitions/cgn/CardExpired";
import { StatusEnum as CgnPendingStatusEnum } from "../../../../../../../definitions/cgn/CardPending";
import CgnStatusDetail from "../CgnStatusDetail";
import { IOColors } from "../../../../../../components/core/variables/IOColors";
import variables from "../../../../../../theme/variables";

const cgnStatusActivated: Card = {
  status: CgnActivatedStatusEnum.ACTIVATED,
  activation_date: new Date("2020-03-04"),
  expiration_date: new Date("2037-02-20")
};

const cgnStatusRevoked: Card = {
  status: CgnRevokedStatusEnum.REVOKED,
  revocation_date: new Date("2030-02-20"),
  activation_date: new Date("2020-03-04"),
  expiration_date: new Date("2037-02-20"),
  revocation_reason: "A reason to revoke" as CardRevoked["revocation_reason"]
};

const cgnStatusExpired: Card = {
  status: CgnExpiredStatusEnum.EXPIRED,
  activation_date: new Date("2020-03-04"),
  expiration_date: new Date("2037-02-20")
};

const cgnStatusPending: Card = {
  status: CgnPendingStatusEnum.PENDING
};

describe("CgnStatusDetail", () => {
  it("Activated status", () => {
    const component = render(
      <CgnStatusDetail cgnDetail={cgnStatusActivated} />
    );
    expect(component).not.toBeNull();
    expect(component.queryByTestId("status-badge")).toHaveTextContent(
      TypedI18n.t("bonus.cgn.detail.status.badge.active")
    );
    expect(component.queryByTestId("status-badge")).toHaveStyle({
      backgroundColor: IOColors.blue
    });
    expect(component.queryByTestId("activation-date-label")).toHaveTextContent(
      TypedI18n.t("bonus.cgn.detail.activationDateLabel")
    );
    expect(component.queryByTestId("activation-date-value")).toHaveTextContent(
      localeDateFormat(
        cgnStatusActivated.activation_date,
        TypedI18n.t("global.dateFormats.shortFormat")
      )
    );
    expect(component.queryByTestId("expiration-date-label")).toBeNull();
    expect(component.queryByTestId("expiration-date-value")).toBeNull();
    expect(component.queryByTestId("revocation-date-label")).toBeNull();
    expect(component.queryByTestId("revocation-date-value")).toBeNull();
  });

  it("Revoked status", () => {
    const component = render(<CgnStatusDetail cgnDetail={cgnStatusRevoked} />);
    expect(component).not.toBeNull();
    expect(component.queryByTestId("status-badge")).toHaveTextContent(
      TypedI18n.t("bonus.cgn.detail.status.badge.revoked")
    );
    expect(component.queryByTestId("status-badge")).toHaveStyle({
      backgroundColor: variables.brandHighLighter
    });
    expect(component.queryByTestId("activation-date-label")).toHaveTextContent(
      TypedI18n.t("bonus.cgn.detail.activationDateLabel")
    );
    expect(component.queryByTestId("activation-date-value")).toHaveTextContent(
      localeDateFormat(
        cgnStatusRevoked.activation_date,
        TypedI18n.t("global.dateFormats.shortFormat")
      )
    );
    expect(component.queryByTestId("expiration-date-label")).toBeNull();
    expect(component.queryByTestId("expiration-date-value")).toBeNull();
    expect(component.queryByTestId("revocation-date-label")).toHaveTextContent(
      TypedI18n.t("bonus.cgn.detail.revocationDateLabel")
    );
    expect(component.queryByTestId("revocation-date-value")).toHaveTextContent(
      localeDateFormat(
        cgnStatusRevoked.revocation_date,
        TypedI18n.t("global.dateFormats.shortFormat")
      )
    );
  });

  it("Expired status", () => {
    const component = render(<CgnStatusDetail cgnDetail={cgnStatusExpired} />);
    expect(component).not.toBeNull();
    expect(component.queryByTestId("status-badge")).toHaveTextContent(
      TypedI18n.t("bonus.cgn.detail.status.badge.expired")
    );
    expect(component.queryByTestId("status-badge")).toHaveStyle({
      backgroundColor: variables.brandHighLighter
    });
    expect(component.queryByTestId("activation-date-label")).toHaveTextContent(
      TypedI18n.t("bonus.cgn.detail.activationDateLabel")
    );
    expect(component.queryByTestId("activation-date-value")).toHaveTextContent(
      localeDateFormat(
        cgnStatusExpired.activation_date,
        TypedI18n.t("global.dateFormats.shortFormat")
      )
    );
    expect(component.queryByTestId("expiration-date-label")).toHaveTextContent(
      TypedI18n.t("bonus.cgn.detail.expirationDateLabel")
    );
    expect(component.queryByTestId("expiration-date-value")).toHaveTextContent(
      localeDateFormat(
        cgnStatusExpired.expiration_date,
        TypedI18n.t("global.dateFormats.shortFormat")
      )
    );
    expect(component.queryByTestId("revocation-date-label")).toBeNull();
    expect(component.queryByTestId("revocation-date-value")).toBeNull();
  });

  it("Pendign status", () => {
    const component = render(<CgnStatusDetail cgnDetail={cgnStatusPending} />);
    expect(component).not.toBeNull();
    expect(component.queryByTestId("status-badge")).toBeNull();

    expect(component.queryByTestId("activation-date-label")).toBeNull();
    expect(component.queryByTestId("activation-date-value")).toBeNull();
    expect(component.queryByTestId("expiration-date-label")).toBeNull();
    expect(component.queryByTestId("expiration-date-value")).toBeNull();
    expect(component.queryByTestId("revocation-date-label")).toBeNull();
    expect(component.queryByTestId("revocation-date-value")).toBeNull();
  });
});
