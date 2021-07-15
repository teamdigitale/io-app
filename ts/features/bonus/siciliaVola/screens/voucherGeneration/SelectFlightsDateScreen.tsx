import * as React from "react";
import { useRef } from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { SafeAreaView } from "react-native";
import { NavigationEvents } from "react-navigation";
import BaseScreenComponent from "../../../../../components/screens/BaseScreenComponent";
import { emptyContextualHelp } from "../../../../../utils/emptyContextualHelp";
import { setAccessibilityFocus } from "../../../../../utils/accessibility";
import { IOStyles } from "../../../../../components/core/variables/IOStyles";
import { H1 } from "../../../../../components/core/typography/H1";
import { GlobalState } from "../../../../../store/reducers/types";
import {
  FlightsDate,
  svGenerateVoucherBack,
  svGenerateVoucherCancel,
  svGenerateVoucherSelectFlightsDate
} from "../../store/actions/voucherGeneration";
import FooterWithButtons from "../../../../../components/ui/FooterWithButtons";
import { navigateToSvSummaryScreen } from "../../navigation/actions";
import I18n from "../../../../../i18n";

type Props = ReturnType<typeof mapDispatchToProps> &
  ReturnType<typeof mapStateToProps>;

const SelectFlightsDateScreen = (props: Props): React.ReactElement => {
  const elementRef = useRef(null);
  const backButtonProps = {
    primary: false,
    bordered: true,
    onPress: props.back,
    title: "Back"
  };
  const continueButtonProps = {
    primary: false,
    bordered: true,
    onPress: props.navigateToSummaryScreen,
    title: "Continue"
  };

  return (
    <BaseScreenComponent goBack={true} contextualHelp={emptyContextualHelp}>
      <NavigationEvents onDidFocus={() => setAccessibilityFocus(elementRef)} />
      <SafeAreaView
        style={IOStyles.flex}
        testID={"SelectFlightsDateScreen"}
        ref={elementRef}
      >
        <H1>{I18n.t("bonus.sv.voucherGeneration.selectFlightsDate.title")}</H1>
      </SafeAreaView>
      <FooterWithButtons
        type={"TwoButtonsInlineHalf"}
        leftButton={backButtonProps}
        rightButton={continueButtonProps}
      />
    </BaseScreenComponent>
  );
};
const mapDispatchToProps = (dispatch: Dispatch) => ({
  back: () => dispatch(svGenerateVoucherBack()),
  cancel: () => dispatch(svGenerateVoucherCancel()),
  selectFlightsDateScreen: (flightsDate: FlightsDate) =>
    dispatch(svGenerateVoucherSelectFlightsDate(flightsDate)),
  navigateToSummaryScreen: () => dispatch(navigateToSvSummaryScreen())
});
const mapStateToProps = (_: GlobalState) => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SelectFlightsDateScreen);