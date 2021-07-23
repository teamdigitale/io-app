import { View } from "native-base";
import * as React from "react";
import I18n from "../../../../../i18n";
import { Body } from "../../../../../components/core/typography/Body";
import { H1 } from "../../../../../components/core/typography/H1";
import { H4 } from "../../../../../components/core/typography/H4";
import { Link } from "../../../../../components/core/typography/Link";
import InternationalCircuitIconsBar from "../../../../../components/wallet/InternationalCircuitIconsBar";

type Props = {
  openTosModal: () => void;
  onSearch?: () => void;
  methodType: "bancomatPay" | "bancomat" | "cobadge";
  showCircuitLogo?: boolean;
  bankName?: string;
  openParticipatingBanksModal?: () => void;
};

const bancomatLocales = () => ({
  title: I18n.t("wallet.searchAbi.bancomat.title"),
  text1: I18n.t("wallet.searchAbi.bancomat.description.text1"),
  text2: I18n.t("wallet.searchAbi.bancomat.description.text2"),
  text3: I18n.t("wallet.searchAbi.bancomat.description.text3"),
  text4: I18n.t("wallet.searchAbi.bancomat.description.text4")
});
const bancomatPayLocales = () => ({
  title: I18n.t("wallet.searchAbi.bpay.title"),
  text1: I18n.t("wallet.searchAbi.bpay.description.text1"),
  text2: I18n.t("wallet.searchAbi.bpay.description.text2"),
  text3: I18n.t("wallet.searchAbi.bpay.description.text3"),
  text4: I18n.t("wallet.searchAbi.bpay.description.text4")
});
const cobadgeLocales = () => ({
  title: I18n.t("wallet.searchAbi.cobadge.title"),
  text1: I18n.t("wallet.searchAbi.cobadge.description.text1"),
  text2: I18n.t("wallet.searchAbi.cobadge.description.text2"),
  text3: I18n.t("wallet.searchAbi.cobadge.description.text3"),
  text4: I18n.t("wallet.searchAbi.cobadge.description.text4")
});
const loadLocales = (methodType: "bancomatPay" | "bancomat" | "cobadge") => {
  switch (methodType) {
    case "bancomat":
      return bancomatLocales();
    case "bancomatPay":
      return bancomatPayLocales();
    case "cobadge":
      return cobadgeLocales();
  }
};

export const SearchStartComponent: React.FunctionComponent<Props> = (
  props: Props
) => {
  const locales = loadLocales(props.methodType);

  return (
    <>
      <H1>{locales.title}</H1>
      {props.showCircuitLogo && (
        <>
          <View spacer={true} large={true} />
          <InternationalCircuitIconsBar />
        </>
      )}

      <View spacer={true} large={true} />
      <Body>
        <H4 weight={"Regular"} color={"bluegreyDark"}>
          {locales.text1}
        </H4>

        {props.methodType === "cobadge" && props.bankName ? (
          <H4 color={"bluegreyDark"}>{props.bankName}</H4>
        ) : (
          <Link
            onPress={
              props.methodType === "cobadge"
                ? props.openParticipatingBanksModal
                : props.openTosModal
            }
          >
            {locales.text2}
          </Link>
        )}
      </Body>

      <View spacer={true} large={true} />
      <Body accessibilityRole="link">
        <H4 weight={"Regular"} color={"bluegreyDark"}>
          {locales.text3}
        </H4>
        <Link
          onPress={
            props.methodType === "cobadge" ? props.openTosModal : props.onSearch
          }
        >
          {locales.text4}
        </Link>
      </Body>
    </>
  );
};
