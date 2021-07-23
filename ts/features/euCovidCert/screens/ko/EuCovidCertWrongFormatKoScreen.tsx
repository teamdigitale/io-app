import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { Image, StyleSheet } from "react-native";
import { View } from "native-base";
import { GlobalState } from "../../../../store/reducers/types";
import { BaseEuCovidCertificateLayout } from "../BaseEuCovidCertificateLayout";
import { H4 } from "../../../../components/core/typography/H4";
import CopyButtonComponent from "../../../../components/CopyButtonComponent";
import { EUCovidCertificateAuthCode } from "../../types/EUCovidCertificate";
import { InfoScreenComponent } from "../../../../components/infoScreen/InfoScreenComponent";
import wrongFormatImage from "../../../../../img/features/euCovidCert/certificate_wrong_format.png";
import I18n from "../../../../i18n";
import { mixpanelTrack } from "../../../../mixpanel";
import WorkunitGenericFailure from "../../../../components/error/WorkunitGenericFailure";
import FooterWithButtons from "../../../../components/ui/FooterWithButtons";
import { confirmButtonProps } from "../../../bonus/bonusVacanze/components/buttons/ButtonConfigurations";
import { openWebUrl } from "../../../../utils/url";
import { euCovidCertificateUrl } from "../../../../urls";
import { euCovidCertCurrentSelector } from "../../store/reducers/current";

type Props = ReturnType<typeof mapDispatchToProps> &
  ReturnType<typeof mapStateToProps>;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  shrink: {
    flexShrink: 1
  }
});

const CopyWithTitleItem: React.FC<{
  title: string;
  toCopy: string;
  testId?: string;
}> = ({ title, toCopy, testId }) => (
  <>
    <View>
      <H4 weight={"Regular"}>{title}</H4>
    </View>
    <View style={styles.row}>
      <H4 weight={"Bold"} testID={`${testId}ToCopy`} style={styles.shrink}>
        {toCopy}
      </H4>
      <View hspacer={true} />
      <CopyButtonComponent textToCopy={toCopy} />
    </View>
  </>
);

const EuCovidCertWrongFormatKoComponent: React.FC<{
  currentAuthCode: EUCovidCertificateAuthCode;
  messageId: string;
}> = ({ currentAuthCode, messageId }) => (
  <>
    <InfoScreenComponent
      image={
        <Image
          source={wrongFormatImage}
          importantForAccessibility={"no"}
          accessibilityElementsHidden={true}
          style={{ width: 104, height: 104, resizeMode: "contain" }}
          testID={"doubtImage"}
        />
      }
      title={I18n.t("features.euCovidCertificate.ko.wrongFormat.title")}
    />
    <H4 weight={"Regular"}>
      {I18n.t("features.euCovidCertificate.ko.wrongFormat.subtitle")}
    </H4>
    <View spacer={true} />
    <CopyWithTitleItem
      title={I18n.t("features.euCovidCertificate.common.authorizationCode")}
      toCopy={currentAuthCode}
      testId={"authorizationCode"}
    />
    <View spacer={true} />
    <CopyWithTitleItem
      title={I18n.t("features.euCovidCertificate.common.messageIdentifier")}
      toCopy={messageId}
      testId={"messageIdentifier"}
    />
  </>
);

const EuCovidCertWrongFormatKoScreen = (props: Props): React.ReactElement => {
  // Handling unexpected error
  if (props.euCovidCertCurrent === null) {
    void mixpanelTrack("EUCOVIDCERT_UNEXPECTED_ERROR");
    return <WorkunitGenericFailure />;
  }

  return (
    <BaseEuCovidCertificateLayout
      testID={"EuCovidCertWrongFormatKoScreen"}
      content={
        <EuCovidCertWrongFormatKoComponent
          currentAuthCode={props.euCovidCertCurrent.authCode}
          messageId={props.euCovidCertCurrent.messageId}
        />
      }
      footer={
        <FooterWithButtons
          type={"SingleButton"}
          leftButton={confirmButtonProps(
            () => openWebUrl(euCovidCertificateUrl),
            I18n.t("features.euCovidCertificate.ko.wrongFormat.cta")
          )}
        />
      }
    />
  );
};
const mapDispatchToProps = (_: Dispatch) => ({});
const mapStateToProps = (state: GlobalState) => ({
  euCovidCertCurrent: euCovidCertCurrentSelector(state)
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EuCovidCertWrongFormatKoScreen);
