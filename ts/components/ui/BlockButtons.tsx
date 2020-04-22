import { Button, Text, View } from "native-base";
import * as React from "react";
import { StyleSheet } from "react-native";
import { ComponentProps } from "../../types/react";
import ButtonDefaultOpacity from "../ButtonDefaultOpacity";
import IconFont from "./IconFont";

const styles = StyleSheet.create({
  button: {
    alignContent: "center",
    justifyContent: "center",
    flex: 1
  },
  buttonTwoThirds: {
    alignContent: "center",
    flex: 2
  },
  flexRow: { flexDirection: "row" }
});

type OwnButtonProps = {
  title: string;
  buttonFontSize?: number;
  iconName?: string;
};

type CommonProps = Readonly<{
  leftButton: BlockButtonProps;
}>;

type BlockButtonProps = ComponentProps<Button> & OwnButtonProps;

export interface SingleButton extends CommonProps {
  type: "SingleButton";
}

export interface TwoButtonsInlineHalf extends CommonProps {
  type: "TwoButtonsInlineHalf";
  rightButton: BlockButtonProps;
}

interface TwoButtonsInlineThird extends CommonProps {
  type: "TwoButtonsInlineThird";
  rightButton: BlockButtonProps;
}

interface TwoButtonsInlineThirdInverted extends CommonProps {
  type: "TwoButtonsInlineThirdInverted";
  rightButton: BlockButtonProps;
}

interface ThreeButtonsInLine extends CommonProps {
  type: "ThreeButtonsInLine";
  rightButton: BlockButtonProps;
  midButton: BlockButtonProps;
}

type Props =
  | SingleButton
  | TwoButtonsInlineHalf
  | TwoButtonsInlineThird
  | TwoButtonsInlineThirdInverted
  | ThreeButtonsInLine;

export type BlockButtonsProps = Props;

/**
 * Implements a component that show buttons on a line on 1, 2 or 3 buttons
 */
export default class BlockButtons extends React.Component<Props, never> {
  private renderRightButton = () => {
    if (this.props.type === "SingleButton") {
      return null;
    }

    const rightButtonStyle =
      this.props.type === "TwoButtonsInlineThird"
        ? styles.buttonTwoThirds
        : styles.button;

    return (
      <React.Fragment>
        <View hspacer={true} />
        {this.renderButton(this.props.rightButton, rightButtonStyle)}
      </React.Fragment>
    );
  };

  private renderMidButton = () => {
    if (this.props.type !== "ThreeButtonsInLine") {
      return null;
    }

    return this.renderButton(this.props.midButton, styles.button);
  };

  private renderLeftButton = () => {
    const leftButtonStyle =
      this.props.type === "TwoButtonsInlineThirdInverted"
        ? styles.buttonTwoThirds
        : styles.button;

    return this.renderButton(this.props.leftButton, leftButtonStyle);
  };

  private renderButton = (
    props: BlockButtonProps,
    style: ComponentProps<typeof ButtonDefaultOpacity>["style"]
  ) => {
    return (
      <ButtonDefaultOpacity style={style} {...props}>
        {props.iconName && <IconFont name={props.iconName} />}
        <Text
          style={
            props.buttonFontSize !== undefined
              ? { fontSize: props.buttonFontSize }
              : {}
          }
        >
          {props.title}
        </Text>
      </ButtonDefaultOpacity>
    );
  };

  public render() {
    return (
      <View style={styles.flexRow}>
        {this.renderLeftButton()}
        {this.renderMidButton()}
        {this.renderRightButton()}
      </View>
    );
  }
}
