import * as React from "react";
import { connect } from "react-redux";
import { View } from "native-base";
import { GlobalState } from "../../../../../store/reducers/types";
import { Dispatch } from "../../../../../store/actions/types";
import { H1 } from "../../../../../components/core/typography/H1";

type Props = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>;

/**
 * Screen which is displayed when a user requested a CGN activation
 * and it took too long to get an answer from the server
 * (the user will be notified when the activation is completed by a message)
 */
const CgnActivationTimeoutScreen = (_: Props): React.ReactElement => (
  // PLACEHOLDER for activation timeout screen
  <View>
    <H1>
      {
        "It took too long to verify the activation, we will notify you once completed"
      }
    </H1>
  </View>
);

const mapStateToProps = (_: GlobalState) => ({});

const mapDispatchToProps = (_: Dispatch) => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CgnActivationTimeoutScreen);
