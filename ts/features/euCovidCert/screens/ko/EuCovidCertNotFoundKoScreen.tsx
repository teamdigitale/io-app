import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { Image, StyleSheet } from "react-native";
import { View } from "native-base";
import I18n from "../../../../i18n";
import { GlobalState } from "../../../../store/reducers/types";
import { BaseEuCovidCertificateLayout } from "../BaseEuCovidCertificateLayout";
import CopyButtonComponent from "../../../../components/CopyButtonComponent";
import doubtImage from "../../../../../img/features/euCovidCert/certificate_not_found.png";
import { InfoScreenComponent } from "../../../../components/infoScreen/InfoScreenComponent";
import { H4 } from "../../../../components/core/typography/H4";
import { EUCovidCertificateAuthCode } from "../../types/EUCovidCertificate";
import { euCovidCertCurrentSelector } from "../../store/reducers/current";
import WorkunitGenericFailure from "../../../../components/error/WorkunitGenericFailure";
import { mixpanelTrack } from "../../../../mixpanel";
import { confirmButtonProps } from "../../../bonus/bonusVacanze/components/buttons/ButtonConfigurations";
import FooterWithButtons from "../../../../components/ui/FooterWithButtons";
import { openWebUrl } from "../../../../utils/url";
import { euCovidCertificateUrl } from "../../../../urls";

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

const EuCovidCertNotFoundKoComponent: React.FC<{
  currentAuthCode: EUCovidCertificateAuthCode;
  messageId: string;
}> = ({ currentAuthCode, messageId }) => (
  <>
    <InfoScreenComponent
      image={
        <Image
          source={doubtImage}
          importantForAccessibility={"no"}
          accessibilityElementsHidden={true}
          style={{ width: 104, height: 104, resizeMode: "contain" }}
          testID={"doubtImage"}
        />
      }
      title={I18n.t("features.euCovidCertificate.ko.notFound.title")}
    />
    <H4 weight={"Regular"}>
      {I18n.t("features.euCovidCertificate.ko.notFound.subtitle")}
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

const EuCovidCertNotFoundKoScreen = (props: Props): React.ReactElement => {
  // Handling unexpected error
  if (props.euCovidCertCurrent === null) {
    void mixpanelTrack("EUCOVIDCERT_UNEXPECTED_ERROR");
    return <WorkunitGenericFailure />;
  }

  return (
    <BaseEuCovidCertificateLayout
      testID={"EuCovidCertNotFoundKoScreen"}
      content={
        <EuCovidCertNotFoundKoComponent
          currentAuthCode={props.euCovidCertCurrent.authCode}
          messageId={props.euCovidCertCurrent.messageId}
        />
      }
      footer={
        <FooterWithButtons
          type={"SingleButton"}
          leftButton={confirmButtonProps(
            () => openWebUrl(euCovidCertificateUrl),
            I18n.t("features.euCovidCertificate.ko.notFound.cta")
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
)(EuCovidCertNotFoundKoScreen);
