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
import color from "color";
import { isString } from "lodash";
import { Input, Item, View } from "native-base";
import * as React from "react";
import { useState } from "react";
import {
  Image,
  ImageSourcePropType,
  ImageStyle,
  StyleSheet,
  TextInputProps
} from "react-native";
import { TextInputMaskProps } from "react-native-masked-text";
import { IconProps } from "react-native-vector-icons/Icon";
import { NavigationEvents } from "react-navigation";
import I18n from "../i18n";
import variables from "../theme/variables";
import { WithTestID } from "../types/WithTestID";
import { makeFontStyleObject } from "./core/fonts";
import { H5 } from "./core/typography/H5";
import { IOColors } from "./core/variables/IOColors";
import IconFont from "./ui/IconFont";
import TextInputMask from "./ui/MaskedInput";

const styles = StyleSheet.create({
  noBottomLine: {
    borderBottomWidth: 0
  },
  bottomLine: {
    borderBottomWidth: 1
  },
  textInputMask: {
    ...makeFontStyleObject("Regular")
  }
});

// Style type must be generalized so as to support both text icons and image icons
type StyleType = IconProps["style"] & ImageStyle;

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
  onPressIcon?: () => void;
  hasNavigationEvents?: boolean;
}>;

interface InputProps extends TextInputProps {
  disabled?: boolean;
}

type Props = WithTestID<CommonProp> &
  (
    | Readonly<{
        type: "masked";
        inputMaskProps: TextInputMaskProps &
          React.ComponentPropsWithRef<typeof TextInputMask>;
      }>
    | Readonly<{
        type: "text";
        inputProps: InputProps;
      }>
  );

export const LabelledItem: React.FC<Props> = ({
  iconPosition = "left",
  ...props
}: // eslint-disable-next-line sonarjs/cognitive-complexity
Props) => {
  const [isEmpty, setIsEmpty] = useState(true);
  const [hasFocus, setHasFocus] = useState(false);

  const isDisabledTextInput =
    props.type === "text" && props.inputProps.disabled;
  const descriptionColor = isDisabledTextInput
    ? "bluegreyLight"
    : props.isValid === false
    ? "red"
    : "bluegreyDark";
  const iconColor = isDisabledTextInput
    ? IOColors.bluegreyLight
    : variables.brandDarkGray;
  const accessibilityLabel = props.accessibilityLabel ?? "";
  const isValid = props.isValid === undefined ? false : props.isValid;
  const isNotValid = props.isValid === undefined ? false : !props.isValid;

  const onSetInputBorderColor = () => {
    if (isDisabledTextInput) {
      return IOColors.greyLight;
    }

    if (hasFocus && isEmpty) {
      return variables.itemBorderDefaultColor;
    }

    return props.focusBorderColor;
  };

  /**
   * check if the input is empty and set the value in the state
   */
  const checkInputIsEmpty = (text?: string) => {
    const isInputEmpty = text === undefined || text.length === 0;
    setIsEmpty(isInputEmpty);
  };

  /**
   * handle input on change text
   */
  const handleOnChangeText = (text: string) => {
    if (props.type === "text") {
      props.inputProps.onChangeText?.(text);
    }
    checkInputIsEmpty(text);
  };

  /**
   * handle masked input on change text
   */
  const handleOnMaskedChangeText = (formatted: string, text?: string) => {
    if (props.type === "masked") {
      props.inputMaskProps.onChangeText?.(formatted, text);
    }
    checkInputIsEmpty(text);
  };

  /**
   * keep track if input (or masked input) gains focus
   */
  const handleOnFocus = () => {
    setHasFocus(true);
  };

  /**
   * keep track if input (or masked input) loses focus
   */
  const handleOnBlur = () => {
    setHasFocus(false);
  };

  return (
    <View>
      {props.label && (
        <View
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden={true}
        >
          <Item style={styles.noBottomLine}>
            <H5 color={isDisabledTextInput ? "bluegreyLight" : "bluegreyDark"}>
              {props.label}
            </H5>
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
            borderColor: onSetInputBorderColor()
          }}
          error={isNotValid}
          success={isValid}
        >
          {props.hasNavigationEvents && (
            <NavigationEvents onWillBlur={props.onPressIcon} />
          )}

          {props.icon &&
            iconPosition === "left" &&
            (isString(props.icon) ? (
              <IconFont
                size={variables.iconSize3}
                color={iconColor}
                name={props.icon}
                style={props.iconStyle}
                onPress={props.onPressIcon}
                accessibilityLabel={props.accessibilityLabelIcon}
              />
            ) : (
              <Image source={props.icon} style={props.iconStyle} />
            ))}

          {props.type === "masked" ? (
            <TextInputMask
              placeholderTextColor={color(variables.brandGray)
                .darken(0.2)
                .string()}
              underlineColorAndroid="transparent"
              style={styles.textInputMask}
              {...props.inputMaskProps}
              onChangeText={handleOnMaskedChangeText}
              onFocus={handleOnFocus}
              onBlur={handleOnBlur}
              testID={`${props.testID}InputMask`}
            />
          ) : (
            <Input
              placeholderTextColor={
                isDisabledTextInput
                  ? color(IOColors.bluegreyLight).string()
                  : color(variables.brandGray).darken(0.2).string()
              }
              underlineColorAndroid="transparent"
              {...props.inputProps}
              onChangeText={handleOnChangeText}
              onFocus={handleOnFocus}
              onBlur={handleOnBlur}
              testID={`${props.testID}Input`}
              disabled={props.inputProps.disabled}
            />
          )}

          {props.icon &&
            iconPosition === "right" &&
            (isString(props.icon) ? (
              <IconFont
                size={variables.iconSize3}
                color={iconColor}
                name={props.icon}
                style={props.iconStyle}
                onPress={props.onPressIcon}
                accessibilityLabel={props.accessibilityLabelIcon}
              />
            ) : (
              <Image source={props.icon} style={props.iconStyle} />
            ))}
        </Item>
      </View>
      {props.description && (
        <View
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden={true}
          key={"description"}
        >
          <Item style={styles.noBottomLine}>
            <H5 weight={"Regular"} color={descriptionColor}>
              {props.description}
            </H5>
          </Item>
        </View>
      )}
    </View>
  );
};
