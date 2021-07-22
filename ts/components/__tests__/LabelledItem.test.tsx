import { fireEvent, render } from "@testing-library/react-native";
import { isString } from "lodash";
import React from "react";
import { LabelledItem, Props } from "../LabelledItem";
import { InputProps } from "../LabelledItem/Input";

jest.mock("react-navigation", () => ({
  NavigationEvents: "mockNavigationEvents"
}));

const textInputProps: InputProps = {
  type: "text",
  inputProps: { value: "value" }
};
const textInputMaskProps: InputProps = {
  type: "masked",
  inputMaskProps: {
    value: "value",
    type: "custom",
    options: {
      mask: "9999 9999 9999 9999 999"
    }
  }
};
const onPress = jest.fn();
const icon = "io-place";
const iconPosition = "left";
const testID = "Text";
const description = "description text";

describe("Test LabelledItem", () => {
  it("should be not null", () => {
    const component = renderComponent(textInputProps);

    expect(component).not.toBeNull();
  });
  it("should render label if is defined", () => {
    const label = "label text";
    const component = renderComponent({ ...textInputProps, label });

    expect(component).not.toBeNull();
    expect(component.queryByTestId("label")).not.toBeNull();
    expect(component.queryByText(label)).toBeTruthy();
  });
  it("should render NavigationEvents if hasNavigationEvents is true and onPress is defined", () => {
    const component = renderComponent({
      ...textInputProps,
      hasNavigationEvents: true,
      onPress
    });

    expect(component).not.toBeNull();
    expect(component.queryByTestId("NavigationEvents")).not.toBeNull();
  });
  it("should render ButtonDefaultOpacity if iconPosition is left and icon is defined", () => {
    const component = renderComponent({
      ...textInputProps,
      iconPosition,
      icon
    });

    expect(component).not.toBeNull();
    expect(component.queryByTestId("ButtonDefaultOpacity")).not.toBeNull();
  });
  it("should render ButtonDefaultOpacity if iconPosition is right and icon is defined", () => {
    const component = renderComponent({
      ...textInputProps,
      iconPosition: "right",
      icon
    });

    expect(component).not.toBeNull();
    expect(component.queryByTestId("ButtonDefaultOpacity")).not.toBeNull();
  });
  it("should render description if is defined", () => {
    const component = renderComponent({
      ...textInputProps,
      description
    });

    expect(component).not.toBeNull();
    expect(component.queryByTestId("description")).not.toBeNull();
    expect(component.queryByText(description)).toBeTruthy();
  });
  it("should render TextInputMask if type is equal to masked", () => {
    const component = renderComponent({
      ...textInputMaskProps,
      testID
    });

    expect(component).not.toBeNull();
    expect(component.queryByTestId(`${testID}InputMask`)).not.toBeNull();
  });
  it("should render InputNativeBase if type is equal to text", () => {
    const component = renderComponent({
      ...textInputProps,
      testID
    });

    expect(component).not.toBeNull();
    expect(component.queryByTestId(`${testID}Input`)).not.toBeNull();
  });
  it("should render IconFont if icon is a string", () => {
    const component = renderComponent({
      ...textInputProps,
      iconPosition,
      icon
    });

    expect(component).not.toBeNull();
    expect(component.queryByTestId("ButtonDefaultOpacity")).not.toBeNull();
    expect(isString(icon)).toBeTruthy();
    expect(component.queryByTestId("IconFont")).not.toBeNull();
  });
  it("should render Image if icon is not a string", () => {
    const iconImage = 1;
    const component = renderComponent({
      ...textInputProps,
      iconPosition,
      icon: iconImage
    });

    expect(component).not.toBeNull();
    expect(component.queryByTestId("ButtonDefaultOpacity")).not.toBeNull();
    expect(isString(iconImage)).toBeFalsy();
    expect(component.queryByTestId("Image")).not.toBeNull();
  });
  it("should call onPress if is defined and ButtonDefaultOpacity is pressed", () => {
    const component = renderComponent({
      ...textInputProps,
      iconPosition,
      icon,
      onPress
    });

    expect(component).not.toBeNull();
    const buttonDefaultOpacity = component.getByTestId("ButtonDefaultOpacity");
    expect(buttonDefaultOpacity).not.toBeNull();
    fireEvent.press(buttonDefaultOpacity);
    expect(onPress).toHaveBeenCalled();
  });
  it("should have red description color if isValid is false", () => {
    const component = renderComponent({
      ...textInputProps,
      description,
      isValid: false
    });

    expect(component).not.toBeNull();
    expect(component.queryByTestId("description")).not.toBeNull();
    expect(component.queryByText(description)).toBeTruthy();
    expect(component.getByTestId("H5-description").props.color).toBe("red");
  });
  it("should have bluegreyDark description color if isValid is true", () => {
    const component = renderComponent({
      ...textInputProps,
      description,
      isValid: true
    });

    expect(component).not.toBeNull();
    expect(component.queryByTestId("description")).not.toBeNull();
    expect(component.queryByText(description)).toBeTruthy();
    expect(component.getByTestId("H5-description").props.color).toBe(
      "bluegreyDark"
    );
  });
  it("should have the correct borderColor if focusBorderColor is defined", () => {
    const focusBorderColor = "red";
    const component = renderComponent({ ...textInputProps, focusBorderColor });

    expect(component).not.toBeNull();
    const itemComponent = component.getByTestId("Item");
    expect(itemComponent).not.toBeNull();
    expect(itemComponent).toHaveStyle({
      borderColor: focusBorderColor
    });
  });
});

const renderComponent = (props: Props) => render(<LabelledItem {...props} />);
