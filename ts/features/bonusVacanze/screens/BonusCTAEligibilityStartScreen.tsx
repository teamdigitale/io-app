import React, { useEffect } from "react";
import { View } from "react-native";
import { connect } from "react-redux";
import { navigationHistoryPop } from "../../../store/actions/navigationHistory";
import { Dispatch } from "../../../store/actions/types";
import { checkBonusEligibility } from "../store/actions/bonusVacanze";

export type Props = ReturnType<typeof mapDispatchToProps>;

// this is a dummy screen reachable only from a message CTA
// when the component is mounted the checkBonusEligibility action will be dispatched
const BonusCTAEligibilityStartScreen = (props: Props) => {
  useEffect(() => props.startEligibilityCheck(), []);

  return <View style={{ flex: 1, backgroundColor: "transparent" }} />;
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  startEligibilityCheck: () => {
    dispatch(checkBonusEligibility.request());
    dispatch(navigationHistoryPop(1));
  }
});

export default connect(
  undefined,
  mapDispatchToProps
)(BonusCTAEligibilityStartScreen);
