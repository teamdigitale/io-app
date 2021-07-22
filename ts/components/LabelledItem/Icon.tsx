import * as React from "react";
import {
  ImageSourcePropType,
  ImageStyle,
  Image,
  StyleSheet
} from "react-native";
import { isString } from "lodash";
import { IconProps } from "react-native-vector-icons/Icon";
import IconFont from "../ui/IconFont";
import variables from "../../theme/variables";
import ButtonDefaultOpacity from "../ButtonDefaultOpacity";

const styles = StyleSheet.create({
  button: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    alignSelf: "auto",
    height: "auto"
  },
  iconFont: {
    paddingRight: 0
  }
});

// Style type must be generalized so as to support both text icons and image icons
export type StyleType = IconProps["style"] & ImageStyle;

type Props = {
  icon: string | ImageSourcePropType;
  iconColor?: string;
  iconStyle?: StyleType;
  accessibilityLabelIcon?: string;
  onPress?: () => void;
};

export const Icon: React.FC<Props> = ({
  icon,
  iconColor,
  iconStyle,
  onPress,
  accessibilityLabelIcon
}): React.ReactElement => (
  <ButtonDefaultOpacity
    testID="ButtonDefaultOpacity"
    onPress={onPress}
    transparent
    style={styles.button}
  >
    {isString(icon) ? (
      <IconFont
        size={variables.iconSize3}
        color={iconColor ?? variables.brandDarkGray}
        name={icon}
        style={[iconStyle, styles.iconFont]}
        accessibilityLabel={accessibilityLabelIcon}
        testID="IconFont"
      />
    ) : (
      <Image source={icon} style={iconStyle} testID="Image" />
    )}
  </ButtonDefaultOpacity>
);
