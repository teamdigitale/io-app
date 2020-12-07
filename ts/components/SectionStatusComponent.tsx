import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import {
  StyleProp,
  StyleSheet,
  TextStyle,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { Text } from "native-base";
import { SectionStatus, SectionStatusKey } from "../api/backendPublic";
import { GlobalState } from "../store/reducers/types";
import { sectionStatusSelector } from "../store/reducers/backendStatus";
import I18n from "../i18n";
import { maybeNotNullyString } from "../utils/strings";
import { openWebUrl } from "../utils/url";
import { IOColors } from "./core/variables/IOColors";
import IconFont from "./ui/IconFont";
import { Label } from "./core/typography/Label";

type OwnProps = {
  sectionKey: SectionStatusKey;
  textStyle?: StyleProp<TextStyle>;
};

type Props = OwnProps & ReturnType<typeof mapStateToProps>;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    width: "100%",
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 8,
    paddingTop: 8,
    alignItems: "flex-start",
    alignContent: "center"
  },
  text: { marginLeft: 16, flex: 1 }
});

const statusColorMap: Record<SectionStatus["level"], string> = {
  normal: IOColors.aqua,
  critical: IOColors.red,
  warning: IOColors.orange
};

const statusIconMap: Record<SectionStatus["level"], string> = {
  normal: "io-complete",
  critical: "io-notice",
  warning: "io-notice"
};
const iconSize = 24;
const color = IOColors.white;

/**
 * this component shows a full width banner with an icon and text
 * it could be tappable if the web url is defined
 * it renders nothing if for the given props.sectionKey there is no data or it is not visible
 * @param props
 * @constructor
 */

const SectionStatusComponent: React.FC<Props> = (props: Props) => {
  if (props.sectionStatus === undefined) {
    return null;
  }
  if (props.sectionStatus.is_visible !== true) {
    return null;
  }
  const sectionStatus = props.sectionStatus;
  // if not italian, all other languages will be treated as english
  const locale = I18n.currentLocale() === "it" ? "it-IT" : "en-EN";
  const iconName = statusIconMap[sectionStatus.level];
  const backgroundColor = statusColorMap[sectionStatus.level];
  const maybeWebUrl = maybeNotNullyString(
    sectionStatus.web_url && sectionStatus.web_url[locale]
  );
  return (
    <TouchableWithoutFeedback onPress={() => maybeWebUrl.map(openWebUrl)}>
      <View style={[styles.container, { backgroundColor }]}>
        <IconFont
          name={iconName}
          size={iconSize}
          color={color}
          style={{ alignSelf: "center" }}
        />
        <Label color={"white"} style={styles.text} weight={"Regular"}>
          {sectionStatus.message[locale]}
          {/* ad an extra blank space if web url is present */}
          {maybeWebUrl.fold("", _ => " ")}
          {maybeWebUrl.fold(undefined, _ => (
            <Text
              style={{
                color,
                textDecorationLine: "underline",
                fontWeight: "bold"
              }}
            >
              {I18n.t("global.sectionStatus.moreInfo")}
            </Text>
          ))}
        </Label>
      </View>
    </TouchableWithoutFeedback>
  );
};

const mapStateToProps = (state: GlobalState, props: OwnProps) => ({
  sectionStatus: sectionStatusSelector(props.sectionKey)(state)
});

/**
 * the component must be re-render only if the sectionStatus changes
 * this is not ensured by the selector because the backend status (update each 60sec)
 * is overwritten on each request
 */
const component = React.memo(
  SectionStatusComponent,
  (prev: Props, curr: Props) =>
    _.isEqual(prev.sectionStatus, curr.sectionStatus)
);
export default connect(mapStateToProps)(component);
