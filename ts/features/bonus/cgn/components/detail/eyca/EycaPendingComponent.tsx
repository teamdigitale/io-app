import * as React from "react";
import { View } from "native-base";
import { StyleSheet } from "react-native";
import { H4 } from "../../../../../../components/core/typography/H4";
import I18n from "../../../../../../i18n";
import IconFont from "../../../../../../components/ui/IconFont";
import { IOColors } from "../../../../../../components/core/variables/IOColors";
import ButtonDefaultOpacity from "../../../../../../components/ButtonDefaultOpacity";
import { Label } from "../../../../../../components/core/typography/Label";
import { InfoBox } from "../../../../../../components/box/InfoBox";
import { openWebUrl } from "../../../../../../utils/url";

const styles = StyleSheet.create({
  rowBlock: {
    flexDirection: "row"
  },
  spaced: {
    justifyContent: "space-between"
  }
});

const ICON_SIZE = 24;
const EYCA_URL = "https://www.eyca.org";

const EycaStatusDetailsComponent: React.FunctionComponent = () => (
  <>
    <View style={[styles.rowBlock, styles.spaced]}>
      <H4>{I18n.t("bonus.cgn.detail.status.eycaCircuit")}</H4>
      <IconFont name={"io-info"} size={ICON_SIZE} color={IOColors.blue} />
    </View>
    <View spacer />
    <InfoBox iconName={"io-info"} alignedCentral iconSize={32}>
      <H4 weight={"Regular"}>
        {I18n.t("bonus.cgn.detail.status.eycaPending")}
      </H4>
    </InfoBox>
    <View spacer />
    <ButtonDefaultOpacity
      bordered
      style={{ width: "100%" }}
      onPress={() => openWebUrl(EYCA_URL)}
    >
      <Label color={"blue"}>
        {I18n.t("bonus.cgn.detail.cta.eyca.pending")}
      </Label>
    </ButtonDefaultOpacity>
  </>
);

export default EycaStatusDetailsComponent;