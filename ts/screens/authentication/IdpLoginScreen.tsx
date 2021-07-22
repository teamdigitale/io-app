import { fromNullable, none } from "fp-ts/lib/Option";
import Instabug from "instabug-reactnative";
import * as pot from "italia-ts-commons/lib/pot";
import { Text, View } from "native-base";
import * as React from "react";
import { Image, Linking, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import {
  WebViewErrorEvent,
  WebViewNavigation
} from "react-native-webview/lib/WebViewTypes";
import { NavigationScreenProps } from "react-navigation";
import { connect } from "react-redux";
import brokenLinkImage from "../../../img/broken-link.png";
import { instabugLog, TypeLogs } from "../../boot/configureInstabug";
import ButtonDefaultOpacity from "../../components/ButtonDefaultOpacity";
import { IdpSuccessfulAuthentication } from "../../components/IdpSuccessfulAuthentication";
import LoadingSpinnerOverlay from "../../components/LoadingSpinnerOverlay";
import BaseScreenComponent from "../../components/screens/BaseScreenComponent";
import IdpCustomContextualHelpContent from "../../components/screens/IdpCustomContextualHelpContent";
import Markdown from "../../components/ui/Markdown";
import { RefreshIndicator } from "../../components/ui/RefreshIndicator";
import I18n from "../../i18n";
import {
  idpLoginUrlChanged,
  loginFailure,
  loginSuccess
} from "../../store/actions/authentication";
import { Dispatch } from "../../store/actions/types";
import {
  isLoggedIn,
  isLoggedOutWithIdp,
  selectedIdentityProviderSelector
} from "../../store/reducers/authentication";
import { idpContextualHelpDataFromIdSelector } from "../../store/reducers/content";
import { GlobalState } from "../../store/reducers/types";
import { SessionToken } from "../../types/SessionToken";
import {
  getIdpLoginUri,
  getIntentFallbackUrl,
  isPosteIDP,
  onLoginUriChanged
} from "../../utils/login";
import { getSpidErrorCodeDescription } from "../../utils/spidErrorCode";
import { getUrlBasepath } from "../../utils/url";
import { mixpanelTrack } from "../../mixpanel";
import { isDevEnv } from "../../utils/environment";

type Props = NavigationScreenProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>;

enum ErrorType {
  "LOADING_ERROR" = "LOADING_ERROR",
  "LOGIN_ERROR" = "LOGIN_ERROR"
}

type State = {
  requestState: pot.Pot<true, ErrorType>;
  errorCode?: string;
  loginTrace?: string;
};

const loginFailureTag = "spid-login-failure";

const styles = StyleSheet.create({
  refreshIndicatorContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  },
  errorContainer: {
    padding: 20,
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  errorTitle: {
    fontSize: 20,
    marginTop: 10
  },
  errorBody: {
    marginTop: 10,
    marginBottom: 10,
    textAlign: "center"
  },
  errorButtonsContainer: {
    position: "absolute",
    bottom: 30,
    flex: 1,
    flexDirection: "row"
  },
  cancelButtonStyle: {
    flex: 1,
    marginEnd: 10
  },
  flex2: {
    flex: 2
  }
});

// if is dev env add "http" to allow the dev-server usage
const originSchemasWhiteList = [
  "https://*",
  "intent://*",
  ...(isDevEnv ? ["http://*"] : [])
];
/**
 * A screen that allows the user to login with an IDP.
 * The IDP page is opened in a WebView
 */
class IdpLoginScreen extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      requestState: pot.noneLoading
    };
  }

  private updateLoginTrace = (url: string): void => {
    this.setState({ loginTrace: url });
  };

  private handleLoadingError = (error: WebViewErrorEvent): void => {
    const { code, description, domain } = error.nativeEvent;
    void mixpanelTrack("SPID_ERROR", {
      idp: this.props.loggedOutWithIdpAuth?.idp.id,
      code,
      description,
      domain
    });
    this.setState({
      requestState: pot.noneError(ErrorType.LOADING_ERROR)
    });
  };

  private handleLoginFailure = (errorCode?: string) => {
    this.props.dispatchLoginFailure(
      new Error(`login failure with code ${errorCode || "n/a"}`)
    );
    const logText = fromNullable(errorCode).fold(
      "login failed with no error code available",
      ec =>
        `login failed with code (${ec}) : ${getSpidErrorCodeDescription(ec)}`
    );

    instabugLog(logText, TypeLogs.ERROR, "login");
    Instabug.appendTags([loginFailureTag]);
    this.setState({
      requestState: pot.noneError(ErrorType.LOGIN_ERROR),
      errorCode
    });
  };

  private handleLoginSuccess = (token: SessionToken) => {
    instabugLog(`login success`, TypeLogs.DEBUG, "login");
    Instabug.resetTags();
    this.props.dispatchLoginSuccess(token);
  };

  private setRequestStateToLoading = (): void =>
    this.setState({ requestState: pot.noneLoading });

  private handleNavigationStateChange = (event: WebViewNavigation): void => {
    if (event.url) {
      const urlChanged = getUrlBasepath(event.url);
      if (urlChanged !== this.state.loginTrace) {
        this.props.dispatchIdpLoginUrlChanged(urlChanged);
        this.updateLoginTrace(urlChanged);
      }
    }
    const isAssertion = fromNullable(event.url).fold(
      false,
      s => s.indexOf("/assertionConsumerService") > -1
    );
    this.setState({
      requestState:
        event.loading || isAssertion ? pot.noneLoading : pot.some(true)
    });
  };

  private handleShouldStartLoading = (event: WebViewNavigation): boolean => {
    const url = event.url;
    // if an intent is coming from Post SPID login form, extract the fallbackUrl and use it in Linking.openURL
    if (isPosteIDP(this.props.loggedOutWithIdpAuth?.idp.id ?? "")) {
      const posteIntent = getIntentFallbackUrl(url);
      if (posteIntent.isSome()) {
        void Linking.openURL(posteIntent.value);
        return false;
      }
    }

    const isLoginUrlWithToken = onLoginUriChanged(
      this.handleLoginFailure,
      this.handleLoginSuccess
    )(event);
    // URL can be loaded if it's not the login URL containing the session token - this avoids
    // making a (useless) GET request with the session in the URL
    return !isLoginUrlWithToken;
  };

  private renderMask = () => {
    if (pot.isLoading(this.state.requestState)) {
      return (
        <View style={styles.refreshIndicatorContainer}>
          <RefreshIndicator />
        </View>
      );
    } else if (pot.isError(this.state.requestState)) {
      const errorType = this.state.requestState.error;
      const errorTranslationKey = `authentication.errors.spid.error_${this.state.errorCode}`;

      return (
        <View style={styles.errorContainer}>
          <Image source={brokenLinkImage} resizeMode="contain" />
          <Text style={styles.errorTitle} bold={true}>
            {I18n.t(
              errorType === ErrorType.LOADING_ERROR
                ? "authentication.errors.network.title"
                : "authentication.errors.login.title"
            )}
          </Text>

          {errorType === ErrorType.LOGIN_ERROR && (
            <Text style={styles.errorBody}>
              {I18n.t(errorTranslationKey, {
                defaultValue: I18n.t("authentication.errors.spid.unknown")
              })}
            </Text>
          )}

          <View style={styles.errorButtonsContainer}>
            <ButtonDefaultOpacity
              onPress={this.props.navigation.goBack}
              style={styles.cancelButtonStyle}
              block={true}
              light={true}
              bordered={true}
            >
              <Text>{I18n.t("global.buttons.cancel")}</Text>
            </ButtonDefaultOpacity>
            <ButtonDefaultOpacity
              onPress={this.setRequestStateToLoading}
              style={styles.flex2}
              block={true}
              primary={true}
            >
              <Text>{I18n.t("global.buttons.retry")}</Text>
            </ButtonDefaultOpacity>
          </View>
        </View>
      );
    }
    // loading complete, no mask needed
    return null;
  };

  get contextualHelp() {
    const { selectedIdpTextData } = this.props;

    if (selectedIdpTextData.isNone()) {
      return {
        title: I18n.t("authentication.idp_login.contextualHelpTitle"),
        body: () => (
          <Markdown>
            {I18n.t("authentication.idp_login.contextualHelpContent")}
          </Markdown>
        )
      };
    }
    const idpTextData = selectedIdpTextData.value;
    return IdpCustomContextualHelpContent(idpTextData);
  }

  public render() {
    const { loggedOutWithIdpAuth, loggedInAuth } = this.props;
    const hasError = pot.isError(this.state.requestState);

    if (loggedInAuth) {
      return <IdpSuccessfulAuthentication />;
    }

    if (!loggedOutWithIdpAuth) {
      // This condition will be true only temporarily (if the navigation occurs
      // before the redux state is updated succesfully)
      return <LoadingSpinnerOverlay isLoading={true} />;
    }
    const loginUri = getIdpLoginUri(loggedOutWithIdpAuth.idp.id);
    return (
      <BaseScreenComponent
        goBack={true}
        contextualHelp={this.contextualHelp}
        faqCategories={["authentication_SPID"]}
        headerTitle={`${I18n.t("authentication.idp_login.headerTitle")} - ${
          loggedOutWithIdpAuth.idp.name
        }`}
      >
        {!hasError && (
          <WebView
            textZoom={100}
            originWhitelist={originSchemasWhiteList}
            source={{ uri: loginUri }}
            onError={this.handleLoadingError}
            javaScriptEnabled={true}
            onNavigationStateChange={this.handleNavigationStateChange}
            onShouldStartLoadWithRequest={this.handleShouldStartLoading}
          />
        )}
        {this.renderMask()}
      </BaseScreenComponent>
    );
  }
}

const mapStateToProps = (state: GlobalState) => {
  const selectedtIdp = selectedIdentityProviderSelector(state);

  const selectedIdpTextData = fromNullable(selectedtIdp).fold(none, idp =>
    idpContextualHelpDataFromIdSelector(idp.id)(state)
  );

  return {
    loggedOutWithIdpAuth: isLoggedOutWithIdp(state.authentication)
      ? state.authentication
      : undefined,
    loggedInAuth: isLoggedIn(state.authentication)
      ? state.authentication
      : undefined,
    selectedIdpTextData
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  dispatchIdpLoginUrlChanged: (url: string) =>
    dispatch(idpLoginUrlChanged({ url })),
  dispatchLoginSuccess: (token: SessionToken) => dispatch(loginSuccess(token)),
  dispatchLoginFailure: (error: Error) => dispatch(loginFailure(error))
});

export default connect(mapStateToProps, mapDispatchToProps)(IdpLoginScreen);
