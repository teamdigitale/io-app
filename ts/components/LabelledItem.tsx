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
import {
  StyleSheet,
  TextInputProps,
  Image,
  ImageSourcePropType,
  ImageStyle
} from "react-native";
import { TextInputMaskProps } from "react-native-masked-text";
import { IconProps } from "react-native-vector-icons/Icon";
import variables from "../theme/variables";
import { WithTestID } from "../types/WithTestID";
import { H5 } from "./core/typography/H5";
import IconFont from "./ui/IconFont";
import TextInputMask from "./ui/MaskedInput";
import I18n from "../i18n";
import { useState } from "react";

const styles = StyleSheet.create({
  noBottomLine: {
    borderBottomWidth: 0
  },
  bottomLine: {
    borderBottomWidth: 1
  }
});

// Style type must be generalized so as to support both text icons and image icons
type StyleType = IconProps["style"] & ImageStyle;

type CommonProp = Readonly<{
  label: string;
  icon?: string | ImageSourcePropType;
  isValid?: boolean;
  iconStyle?: StyleType;
  focusBorderColor?: string;
  description?: string;
  inputAccessibilityLabel?: string;
  inputAccessibilityHint?: string;
}>;

type Props = WithTestID<CommonProp> &
  (
    | Readonly<{
        type: "masked";
        inputMaskProps: TextInputMaskProps &
          React.ComponentPropsWithRef<typeof TextInputMask>;
      }>
    | Readonly<{
        type: "text";
        inputProps: TextInputProps;
      }>
  );

export const LabelledItem: React.FC<Props> = (props: Props) => {
  const [isEmpty, setIsEmpty] = useState(true);
  const [hasFocus, setHasFocus] = useState(false);

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
    if (props.type === "text" && props.inputProps.onChangeText) {
      props.inputProps.onChangeText(text);
    }
    checkInputIsEmpty(text);
  };

  /**
   * handle masked input on change text
   */
  const handleOnMaskedChangeText = (formatted: string, text?: string) => {
    if (props.type === "masked" && props.inputMaskProps.onChangeText) {
      props.inputMaskProps.onChangeText(formatted, text);
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
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden={true}
      >
        <Item style={styles.noBottomLine}>
          <H5>{props.label}</H5>
        </Item>
      </View>

      <View
        accessible={true}
        accessibilityLabel={I18n.t("global.accessibility.textField", {
          inputLabel: props.inputAccessibilityLabel ?? ""
        })}
        accessibilityHint={props.inputAccessibilityHint}
      >
        <Item
          style={{
            ...styles.bottomLine,
            borderColor:
              hasFocus && isEmpty
                ? variables.itemBorderDefaultColor
                : props.focusBorderColor
          }}
          error={props.isValid === undefined ? false : !props.isValid}
          success={props.isValid === undefined ? false : props.isValid}
        >
          {props.icon &&
            (isString(props.icon) ? (
              <IconFont
                size={variables.iconSize3}
                color={variables.brandDarkGray}
                name={props.icon}
                style={props.iconStyle}
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
              {...props.inputMaskProps}
              onChangeText={handleOnMaskedChangeText}
              onFocus={handleOnFocus}
              onBlur={handleOnBlur}
              testID={`${props.testID}InputMask`}
            />
          ) : (
            <Input
              placeholderTextColor={color(variables.brandGray)
                .darken(0.2)
                .string()}
              underlineColorAndroid="transparent"
              {...props.inputProps}
              onChangeText={handleOnChangeText}
              onFocus={handleOnFocus}
              onBlur={handleOnBlur}
              testID={`${props.testID}Input`}
            />
          )}
        </Item>
      </View>
      {props.description && (
        <View
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden={true}
        >
          <Item style={styles.noBottomLine}>
            <H5
              weight={"Regular"}
              color={props.isValid === false ? "red" : "bluegreyDark"}
            >
              {props.description}
            </H5>
          </Item>
        </View>
      )}
    </View>
  );
};
