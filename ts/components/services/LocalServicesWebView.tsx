import { StyleSheet, View } from "react-native";
import React from "react";
import * as pot from "italia-ts-commons/lib/pot";
import WebView from "react-native-webview";
import { WebViewNavigation } from "react-native-webview/lib/WebViewTypes";
import URLParse from "url-parse";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { fromNullable } from "fp-ts/lib/Option";
import { RefreshIndicator } from "../ui/RefreshIndicator";
import { ServicePublic } from "../../../definitions/backend/ServicePublic";
import { withLightModalContext } from "../helpers/withLightModalContext";
import { GlobalState } from "../../store/reducers/types";
import { loadServiceDetail } from "../../store/actions/services";
import { servicesByIdSelector } from "../../store/reducers/entities/services/servicesById";
import { isStrictSome } from "../../utils/pot";
import I18n from "../../i18n";
import { showToast } from "../../utils/showToast";
import { localServicesWebUrl } from "../../config";
import GenericErrorComponent from "../screens/GenericErrorComponent";

type Props = {
  onServiceSelect: (service: ServicePublic) => void;
} & ReturnType<typeof mapDispatchToProps> &
  ReturnType<typeof mapStateToProps>;

const styles = StyleSheet.create({
  refreshIndicatorContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  },
  genericError: {
    flex: 1,
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  }
});
const renderLoading = () => (
  <View style={styles.refreshIndicatorContainer}>
    <RefreshIndicator />
  </View>
);
const queryParam = "idService";

/**
 * This component is basically a webview that loads an url showing local services
 * It intercepts the request of loading a service and it does:
 * - block that request from loading
 * - extract from the request url the service id
 * - load the selected service starting from the service id (load and error are handled)
 */
const LocalServicesWebView = (props: Props) => {
  const [serviceIdToLoad, setServiceIdToLoad] = React.useState<
    string | undefined
  >(undefined);
  const [webViewError, setWebViewError] = React.useState<boolean>(false);
  const webViewRef = React.createRef<WebView>();

  React.useEffect(() => {
    fromNullable(serviceIdToLoad)
      .mapNullable(sid => props.servicesById[sid])
      .map(servicePot => {
        // if service has been loaded
        if (isStrictSome(servicePot)) {
          props.onServiceSelect(servicePot.value);
          return;
        }
        if (pot.isError(servicePot)) {
          showToast(I18n.t("global.genericError"));
        }
      });
  }, [props.servicesById]);

  const reloadWebView = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
      setWebViewError(false);
    }
  };

  const handleOnShouldStartLoadWithRequest = (navState: WebViewNavigation) => {
    if (navState.url) {
      const urlParse = new URLParse(navState.url, true);
      const maybeServiceId = urlParse.query[queryParam];
      // click on service
      if (maybeServiceId) {
        setServiceIdToLoad(maybeServiceId);
        // request for 'internal' service loading
        props.loadService(maybeServiceId);
        // avoid webview loading this url and
        return false;
      }
      return true;
    }
    return true;
  };
  const isLoadingServiceLoading = fromNullable(serviceIdToLoad)
    .mapNullable(sid => props.servicesById[sid])
    .fold(false, pot.isLoading);
  return (
    <>
      {isLoadingServiceLoading && renderLoading()}

      <WebView
        ref={webViewRef}
        style={{ flex: 1 }}
        textZoom={100}
        source={{
          uri: localServicesWebUrl
        }}
        onError={() => setWebViewError(true)}
        onShouldStartLoadWithRequest={handleOnShouldStartLoadWithRequest}
        startInLoadingState={true}
        renderLoading={renderLoading}
        javaScriptEnabled={true}
      />
      {webViewError && (
        <View style={styles.genericError}>
          <GenericErrorComponent onRetry={reloadWebView} />
        </View>
      )}
    </>
  );
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  loadService: (serviceId: string) =>
    dispatch(loadServiceDetail.request(serviceId))
});

const mapStateToProps = (state: GlobalState) => ({
  servicesById: servicesByIdSelector(state)
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withLightModalContext(LocalServicesWebView));
