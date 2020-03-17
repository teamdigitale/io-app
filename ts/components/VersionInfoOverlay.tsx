import { Text, View } from "native-base";
import * as React from "react";
import { Platform, StyleSheet } from "react-native";
import DeviceInfo from "react-native-device-info";
import { connect } from "react-redux";

import { ReduxProps } from "../store/actions/types";
import { GlobalState } from "../store/reducers/types";
import { getCurrentRouteName } from "../utils/navigation";

type Props = ReturnType<typeof mapStateToProps> & ReduxProps;

const styles = StyleSheet.create({
  versionContainer: {
    position: "absolute",
    top: Platform.select({
      ios: 20,
      android: 0
    }),
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-start",
    alignItems: "center",
    zIndex: 1000
  },

  versionText: {
    fontSize: 12,
    lineHeight: 14,
    color: "#000000"
  },

  routeText: {
    fontSize: 10,
    lineHeight: 12,
    color: "#000000"
  }
});

const VersionInfoOverlay: React.SFC<Props> = props => {
  const appVersion = DeviceInfo.getVersion();
  const serverInfo = props.serverInfo;
  const serverVersion = serverInfo.fold("?", v => v.version);
  return (
    <View style={styles.versionContainer} pointerEvents="box-none">
      <Text style={styles.versionText}>
        {appVersion} - {serverVersion}
      </Text>
      <Text style={styles.routeText}>{getCurrentRouteName(props.nav)}</Text>
    </View>
  );
};

const mapStateToProps = (state: GlobalState) => ({
  nav: state.nav,
  serverInfo: state.backendStatus.status
});

export default connect(mapStateToProps)(VersionInfoOverlay);
