import { range } from "fp-ts/lib/Array";
import { left, right } from "fp-ts/lib/Either";
import { Tuple2 } from "italia-ts-commons/lib/tuples";
import { Millisecond } from "italia-ts-commons/lib/units";
import { debounce, shuffle } from "lodash";
import { Text, View } from "native-base";
import * as React from "react";
import { Alert, Dimensions, StyleSheet, ViewStyle } from "react-native";
import I18n from "../../i18n";
import { BiometryPrintableSimpleType } from "../../screens/onboarding/FingerprintScreen";
import customVariables from "../../theme/variables";
import { PinString } from "../../types/PinString";
import { ComponentProps } from "../../types/react";
import { PIN_LENGTH, PIN_LENGTH_SIX } from "../../utils/constants";
import { ShakeAnimation } from "../animations/ShakeAnimation";
import { Link } from "../core/typography/Link";
import InputPlaceHolder from "./InputPlaceholder";
import { DigitRpr, KeyPad } from "./KeyPad";

interface Props {
  activeColor: string;
  delayOnFailureMillis?: number;
  clearOnInvalid?: boolean;
  shufflePad?: boolean;
  isFingerprintEnabled?: any;
  isValidatingTask?: boolean;
  biometryType?: any;
  compareWithCode?: string;
  inactiveColor: string;
  disabled?: boolean;
  buttonType: ComponentProps<typeof KeyPad>["buttonType"];
  onFulfill: (code: PinString, isValid: boolean) => void;
  onCancel?: () => void;
  onPinResetHandler?: () => void;
  onFingerPrintReq?: () => void;
  onDeleteLastDigit?: () => void;
  remainingAttempts?: number;
}

interface State {
  value: string;
  isDisabled: boolean;
  pinLength: number;
  pinPadValues: ReadonlyArray<string>;
  scalableDimension?: ViewStyle;
}

const styles = StyleSheet.create({
  placeholderContainer: {
    flexDirection: "row",
    justifyContent: "center"
  },
  mediumText: {
    fontSize: 18,
    lineHeight: 21,
    textAlign: "center"
  }
});

const screenWidth = Dimensions.get("window").width;

const SMALL_ICON_WIDTH = 17;
const ICON_WIDTH = 48;
const SHAKE_ANIMATION_DURATION = 600 as Millisecond;
const INPUT_MARGIN = 36;

/**
 * A customized CodeInput component.
 */
class Pinpad extends React.PureComponent<Props, State> {
  private onFulfillTimeoutId?: number;
  private onDelayOnFailureTimeoutId?: number;
  private shakeAnimationRef = React.createRef<ShakeAnimation>();

  /**
   * Get the name of the icon (from icon font) to represent depending on
   * the available biometry functionality available on the device
   */
  private getBiometryIconName(
    biometryPrintableSimpleType: BiometryPrintableSimpleType
  ): DigitRpr {
    switch (biometryPrintableSimpleType) {
      case "FINGERPRINT":
      case "TOUCH_ID":
        return right({
          name: "io-fingerprint",
          size: ICON_WIDTH,
          accessibilityLabel: I18n.t(
            "identification.unlockCode.accessibility.fingerprint"
          )
        });
      case "FACE_ID":
        return right({
          name: "io-face-id",
          size: ICON_WIDTH,
          accessibilityLabel: I18n.t(
            "identification.unlockCode.accessibility.faceId"
          )
        });
    }
  }

  private deleteLastDigit = () => {
    this.setState(prev => ({
      value:
        prev.value.length > 0
          ? prev.value.slice(0, prev.value.length - 1)
          : prev.value
    }));
    if (this.props.onDeleteLastDigit) {
      this.props.onDeleteLastDigit();
    }
  };

  /**
   * the pad can be componed by
   * - strings
   * - chars
   * - icons (from icon font): they has to be declared as 'icon:<ICONAME>' (width 48) or 'sicon:<ICONAME>' (width 17)
   */
  private pinPadDigits = (): ComponentProps<typeof KeyPad>["digits"] => {
    const { pinPadValues } = this.state;

    return [
      [
        Tuple2(left(pinPadValues[1]), () =>
          this.handlePinDigit(pinPadValues[1])
        ),
        Tuple2(left(pinPadValues[2]), () =>
          this.handlePinDigit(pinPadValues[2])
        ),
        Tuple2(left(pinPadValues[3]), () =>
          this.handlePinDigit(pinPadValues[3])
        )
      ],
      [
        Tuple2(left(pinPadValues[4]), () =>
          this.handlePinDigit(pinPadValues[4])
        ),
        Tuple2(left(pinPadValues[5]), () =>
          this.handlePinDigit(pinPadValues[5])
        ),
        Tuple2(left(pinPadValues[6]), () =>
          this.handlePinDigit(pinPadValues[6])
        )
      ],
      [
        Tuple2(left(pinPadValues[7]), () =>
          this.handlePinDigit(pinPadValues[7])
        ),
        Tuple2(left(pinPadValues[8]), () =>
          this.handlePinDigit(pinPadValues[8])
        ),
        Tuple2(left(pinPadValues[9]), () =>
          this.handlePinDigit(pinPadValues[9])
        )
      ],
      [
        this.props.isFingerprintEnabled &&
        this.props.biometryType &&
        this.props.onFingerPrintReq
          ? Tuple2(
              this.getBiometryIconName(this.props.biometryType),
              this.props.onFingerPrintReq
            )
          : undefined,
        Tuple2(left(pinPadValues[0]), () =>
          this.handlePinDigit(pinPadValues[0])
        ),
        Tuple2(
          right({
            name: "io-cancel",
            size: SMALL_ICON_WIDTH,
            accessibilityLabel: I18n.t(
              "identification.unlockCode.accessibility.delete"
            )
          }),
          this.deleteLastDigit
        )
      ]
    ];
  };

  private confirmResetAlert = () =>
    Alert.alert(
      I18n.t("identification.forgetCode.confirmTitle"),
      I18n.t(
        this.props.isValidatingTask
          ? "identification.forgetCode.confirmMsgWithTask"
          : "identification.forgetCode.confirmMsg"
      ),
      [
        {
          text: I18n.t("global.buttons.confirm"),
          style: "default",
          onPress: this.props.onPinResetHandler
        },
        {
          text: I18n.t("global.buttons.cancel"),
          style: "cancel"
        }
      ],
      { cancelable: false }
    );

  constructor(props: Props) {
    super(props);
    this.state = {
      value: "",
      isDisabled: false,
      pinLength: PIN_LENGTH,
      pinPadValues: range(0, 9).map(s => s.toString()),
      scalableDimension: undefined
    };
  }

  public componentDidMount() {
    const { pinPadValues } = this.state;

    const pinLength =
      this.props.compareWithCode !== undefined
        ? this.props.compareWithCode.length
        : PIN_LENGTH_SIX;

    // we avoid to shuffle pin/code pad in dev env
    const newPinPadValue =
      this.props.shufflePad !== true ? pinPadValues : shuffle(pinPadValues);

    const scalableDimension: ViewStyle = {
      width:
        (screenWidth -
          customVariables.spacerWidth * (pinLength - 1) -
          customVariables.contentPadding * 2 -
          INPUT_MARGIN * 2) /
        pinLength
    };

    this.setState({
      pinLength,
      scalableDimension,
      pinPadValues: newPinPadValue
    });
  }

  public componentWillUnmount() {
    if (this.onFulfillTimeoutId) {
      clearTimeout(this.onFulfillTimeoutId);
    } else if (this.onDelayOnFailureTimeoutId) {
      clearTimeout(this.onDelayOnFailureTimeoutId);
    }
  }

  private handleChangeText = (inputValue: string) => {
    // if the component is disabled don't handle any input
    if (this.props.disabled) {
      return;
    }
    this.setState({ value: inputValue });

    // Pin/code is fulfilled
    if (inputValue.length === this.state.pinLength) {
      const isValid = inputValue === this.props.compareWithCode;

      if (!isValid && this.props.clearOnInvalid) {
        this.debounceClear();
        if (this.props.delayOnFailureMillis) {
          // disable click keypad
          this.setState({
            isDisabled: true
          });

          // re-enable after delayOnFailureMillis milliseconds
          // eslint-disable-next-line
          this.onDelayOnFailureTimeoutId = setTimeout(() => {
            this.setState({
              isDisabled: false
            });
          }, this.props.delayOnFailureMillis);
          // start animation 'shake'
          if (this.shakeAnimationRef.current) {
            this.shakeAnimationRef.current.shake();
          }
        }
      }

      // Fire the callback asynchronously, otherwise this component
      // will be unmounted before the render of the last bullet placeholder.
      // eslint-disable-next-line
      this.onFulfillTimeoutId = setTimeout(() =>
        this.props.onFulfill(inputValue as PinString, isValid)
      );
    }
  };

  private handlePinDigit = (digit: string) =>
    this.handleChangeText(
      `${this.state.value}${digit}`.substr(0, this.state.pinLength)
    );

  public debounceClear = debounce(() => {
    this.setState({ value: "" });
  }, 100);

  public render() {
    return (
      <React.Fragment>
        <InputPlaceHolder
          digits={this.state.pinLength}
          activeColor={this.props.activeColor}
          inactiveColor={this.props.inactiveColor}
          inputValue={this.state.value}
          customHorizontalMargin={INPUT_MARGIN}
          accessibilityLabel={I18n.t("identification.unlockCode.reset.code")}
        />
        <View spacer={true} />
        {this.props.onPinResetHandler !== undefined && (
          <React.Fragment>
            <Text
              white={this.props.buttonType === "primary"}
              onPress={this.confirmResetAlert}
              alignCenter={true}
            >
              {`${I18n.t("identification.unlockCode.reset.button")} `}
              <Text
                underlined={true}
                white={this.props.buttonType === "primary"}
              >
                {I18n.t("identification.unlockCode.reset.code")}
              </Text>
              <Text white={this.props.buttonType === "primary"}>
                {I18n.t("global.symbols.question")}
              </Text>
            </Text>
            <View spacer={true} />
          </React.Fragment>
        )}
        <View spacer={true} />
        <ShakeAnimation
          duration={SHAKE_ANIMATION_DURATION}
          ref={this.shakeAnimationRef}
        >
          <KeyPad
            digits={this.pinPadDigits()}
            buttonType={this.props.buttonType}
            isDisabled={this.state.isDisabled}
          />
        </ShakeAnimation>
        {this.props.onCancel && (
          <React.Fragment>
            <View spacer={true} large={true} />
            <Link style={styles.mediumText} onPress={this.props.onCancel}>
              {I18n.t("global.buttons.cancel")}
            </Link>
          </React.Fragment>
        )}
      </React.Fragment>
    );
  }
}

export default Pinpad;
