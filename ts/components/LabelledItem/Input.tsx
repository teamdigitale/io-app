import color from "color";
import * as React from "react";
import { Input as InputNativeBase } from "native-base";
import { StyleSheet, TextInputProps } from "react-native";
import { TextInputMaskProps } from "react-native-masked-text";
import variables from "../../theme/variables";
import { WithTestID } from "../../types/WithTestID";
import { makeFontStyleObject } from "../core/fonts";
import TextInputMask from "../ui/MaskedInput";

const styles = StyleSheet.create({
  textInputMask: {
    ...makeFontStyleObject("Regular")
  }
});

type CommonProp = Readonly<{
  setIsEmpty: React.Dispatch<React.SetStateAction<boolean>>;
  setHasFocus: React.Dispatch<React.SetStateAction<boolean>>;
}>;

interface TextInputAdditionalProps extends TextInputProps {
  disabled?: boolean;
}

export type InputProps =
  | Readonly<{
      type: "masked";
      inputMaskProps: TextInputMaskProps &
        React.ComponentPropsWithRef<typeof TextInputMask>;
    }>
  | Readonly<{
      type: "text";
      inputProps: TextInputAdditionalProps;
    }>;

type Props = WithTestID<CommonProp> & InputProps;

export const Input: React.FC<Props> = (props: Props): React.ReactElement => {
  /**
   * check if the input is empty and set the value in the state
   */
  const checkInputIsEmpty = (text?: string) => {
    const isInputEmpty = text === undefined || text.length === 0;
    props.setIsEmpty(isInputEmpty);
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
    props.setHasFocus(true);
  };

  /**
   * keep track if input (or masked input) loses focus
   */
  const handleOnBlur = () => {
    props.setHasFocus(false);
  };

  return props.type === "masked" ? (
    <TextInputMask
      placeholderTextColor={color(variables.brandGray).darken(0.2).string()}
      underlineColorAndroid="transparent"
      style={styles.textInputMask}
      {...props.inputMaskProps}
      onChangeText={handleOnMaskedChangeText}
      onFocus={handleOnFocus}
      onBlur={handleOnBlur}
      testID={`${props.testID}InputMask`}
    />
  ) : (
    <InputNativeBase
      placeholderTextColor={color(variables.brandGray).darken(0.2).string()}
      underlineColorAndroid="transparent"
      {...props.inputProps}
      onChangeText={handleOnChangeText}
      onFocus={handleOnFocus}
      onBlur={handleOnBlur}
      testID={`${props.testID}Input`}
      disabled={props.inputProps.disabled}
    />
  );
};
