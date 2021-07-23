import { View } from "native-base";
import * as React from "react";
import { useState } from "react";
import { Platform, SafeAreaView, ScrollView } from "react-native";
import { Iban } from "../../../../../../../definitions/backend/Iban";
import { makeFontStyleObject } from "../../../../../../components/core/fonts";
import { Body } from "../../../../../../components/core/typography/Body";
import { H1 } from "../../../../../../components/core/typography/H1";
import { H4 } from "../../../../../../components/core/typography/H4";
import { H5 } from "../../../../../../components/core/typography/H5";
import { IOStyles } from "../../../../../../components/core/variables/IOStyles";
import { LabelledItem } from "../../../../../../components/LabelledItem";
import BaseScreenComponent from "../../../../../../components/screens/BaseScreenComponent";
import I18n from "../../../../../../i18n";
import { FooterTwoButtons } from "../../../../bonusVacanze/components/markdown/FooterTwoButtons";

type OwnProps = {
  onBack: () => void;
  onIbanConfirm: (iban: Iban) => void;
  onContinue: () => void;
  startIban?: string;
  cancelText: string;
};

type Props = OwnProps &
  Pick<React.ComponentProps<typeof BaseScreenComponent>, "contextualHelp">;

// https://en.wikipedia.org/wiki/International_Bank_Account_Number
// Italian Iban max length: 27 (sample: IT60X0542811101000000123456)
const IbanMaxLength = 34;

const loadLocales = () => ({
  headerTitle: I18n.t("bonus.bpd.title"),
  title: I18n.t("bonus.bpd.iban.insertion.title"),
  body1: I18n.t("bonus.bpd.iban.insertion.body1"),
  body1Bold: I18n.t("bonus.bpd.iban.insertion.body1Bold"),
  body2: I18n.t("bonus.bpd.iban.insertion.body2"),
  ibanDescription: I18n.t("bonus.bpd.iban.iban")
});

const IBANInputStyle = makeFontStyleObject("Regular", false, "RobotoMono");

const upperCaseAndNoBlanks = (text: string) =>
  text.replace(/\s/g, "").toUpperCase();

export const IbanInsertionComponent: React.FunctionComponent<Props> = props => {
  const [iban, setIban] = useState(props.startIban ?? "");
  const isValidIban = iban.length > 0 && Iban.decode(iban).isRight();
  const userCanContinue = isValidIban && iban.length > 0;
  const {
    headerTitle,
    title,
    body1,
    body1Bold,
    body2,
    ibanDescription
  } = loadLocales();

  return (
    <BaseScreenComponent
      goBack={props.onBack}
      headerTitle={headerTitle}
      contextualHelp={props.contextualHelp}
    >
      <SafeAreaView style={IOStyles.flex}>
        <ScrollView>
          <View style={[IOStyles.horizontalContentPadding, IOStyles.flex]}>
            <View spacer={true} large={true} />
            <H1>{title}</H1>
            <View spacer={true} large={true} />
            <Body>
              {body1}
              <H4>{body1Bold}</H4>
            </Body>
            <View spacer={true} large={true} />
            <H5>{ibanDescription}</H5>
            <LabelledItem
              type="text"
              isValid={!iban ? undefined : isValidIban}
              inputProps={{
                value: iban,
                autoCapitalize: "characters",
                maxLength: IbanMaxLength,
                onChangeText: text => {
                  // On Android we cannot modify the input text, or the text is duplicated
                  setIban(
                    Platform.select({
                      android: text,
                      default: upperCaseAndNoBlanks(text)
                    })
                  );
                },
                style: IBANInputStyle
              }}
            />
            <View spacer={true} large={true} />
            <View spacer={true} small={true} />
            <Body>{body2}</Body>
          </View>
        </ScrollView>
        <FooterTwoButtons
          rightDisabled={!userCanContinue}
          onRight={() =>
            Iban.decode(upperCaseAndNoBlanks(iban)).map(props.onIbanConfirm)
          }
          onCancel={props.onContinue}
          rightText={I18n.t("global.buttons.continue")}
          leftText={props.cancelText}
        />
      </SafeAreaView>
    </BaseScreenComponent>
  );
};
