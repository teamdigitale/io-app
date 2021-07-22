/**
 * Display a labelled, followed by a
 * input and an icon on the left-end
 * side of the input
 *
 * LABEL
 * X __________
 * ^     ^
 * icon  |
 *       input
 */
import { Item, View } from "native-base";
import * as React from "react";
import { useState } from "react";
import { ImageSourcePropType, StyleSheet } from "react-native";
import { NavigationEvents } from "react-navigation";
import I18n from "../../i18n";
import variables from "../../theme/variables";
import { WithTestID } from "../../types/WithTestID";
import { H5 } from "../core/typography/H5";
import { Icon, StyleType } from "./Icon";
import { Input, InputProps } from "./Input";

const styles = StyleSheet.create({
  noBottomLine: {
    borderBottomWidth: 0
  },
  bottomLine: {
    borderBottomWidth: 1
  },
  flex: {
    flex: 1
  }
});

type CommonProp = Readonly<{
  label?: string;
  icon?: string | ImageSourcePropType;
  iconPosition?: "left" | "right";
  iconStyle?: StyleType;
  iconColor?: string;
  isValid?: boolean;
  focusBorderColor?: string;
  description?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityLabelIcon?: string;
  onPress?: () => void;
  hasNavigationEvents?: boolean;
}>;

export type Props = WithTestID<CommonProp> & InputProps;

export const LabelledItem: React.FC<Props> = ({
  iconPosition = "left",
  ...props
}: Props) => {
  const [isEmpty, setIsEmpty] = useState(true);
  const [hasFocus, setHasFocus] = useState(false);

  const descriptionColor = props.isValid === false ? "red" : "bluegreyDark";
  const accessibilityLabel = props.accessibilityLabel ?? "";
  const inputBorderColor =
    hasFocus && isEmpty
      ? variables.itemBorderDefaultColor
      : props.focusBorderColor;
  const isValid = props.isValid === undefined ? false : props.isValid;
  const isNotValid = props.isValid === undefined ? false : !props.isValid;

  return (
    <View style={styles.flex}>
      {props.label && (
        <View
          testID="label"
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden={true}
        >
          <Item style={styles.noBottomLine}>
            <H5>{props.label}</H5>
          </Item>
        </View>
      )}

      <View
        accessible={true}
        accessibilityLabel={I18n.t("global.accessibility.textField", {
          inputLabel: accessibilityLabel
        })}
        accessibilityHint={props.accessibilityHint}
      >
        <Item
          style={{
            ...styles.bottomLine,
            borderColor: inputBorderColor
          }}
          error={isNotValid}
          success={isValid}
          testID="Item"
        >
          {props.hasNavigationEvents && props.onPress && (
            <NavigationEvents
              onWillBlur={props.onPress}
              testID="NavigationEvents"
            />
          )}

          {iconPosition === "left" && props.icon && (
            <Icon
              icon={props.icon}
              iconColor={props.iconColor}
              iconStyle={props.iconStyle}
              accessibilityLabelIcon={props.accessibilityLabelIcon}
              onPress={props.onPress}
            />
          )}

          <Input setHasFocus={setHasFocus} setIsEmpty={setIsEmpty} {...props} />

          {iconPosition === "right" && props.icon && (
            <Icon
              icon={props.icon}
              iconColor={props.iconColor}
              iconStyle={props.iconStyle}
              accessibilityLabelIcon={props.accessibilityLabelIcon}
              onPress={props.onPress}
            />
          )}
        </Item>
      </View>
      {props.description && (
        <View
          testID="description"
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden={true}
          key={"description"}
        >
          <Item style={styles.noBottomLine}>
            <H5
              weight={"Regular"}
              color={descriptionColor}
              testID="H5-description"
            >
              {props.description}
            </H5>
          </Item>
        </View>
      )}
    </View>
  );
};
