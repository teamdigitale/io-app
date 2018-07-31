import { Button, NativeBase, Text, View } from "native-base";
import { connectStyle } from "native-base-shoutem-theme";
import mapPropsToStyleNames from "native-base/src/utils/mapPropsToStyleNames";
import * as React from "react";

type OwnProps = {
  title: string;
};

type Props = Readonly<{
  leftButton: NativeBase.Button & OwnProps;
  rightButton: NativeBase.Button & OwnProps;
  inlineHalf: boolean;
  inlineOneThird: boolean;
}>;

/**
 * Implements a component that show 2 buttons in footer with select style (inlineHalf | inlineOneThird)
 */
class FooterButtons extends React.Component<Props> {
  public render() {
    const {
      title: leftButtonTitle,
      ...otherPropsLeftButton
    } = this.props.leftButton;
    const {
      title: rightButtonTitle,
      ...otherPropsRightButton
    } = this.props.rightButton;

    return (
      <View footer={true}>
        <Button {...otherPropsLeftButton}>
          <Text>{leftButtonTitle}</Text>
        </Button>
        {this.props.inlineHalf || this.props.inlineOneThird ? (
          <View hspacer={true} />
        ) : (
          <View spacer={true} />
        )}
        <Button {...otherPropsRightButton}>
          <Text>{rightButtonTitle}</Text>
        </Button>
      </View>
    );
  }
}

export default connectStyle(
  "UIComponent.FooterButtons",
  {},
  mapPropsToStyleNames
)(FooterButtons);
