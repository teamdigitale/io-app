/**
 * A component to display a brandDarkGray background color on the screen using it
 */
import { Content, View } from "native-base";
import * as React from "react";
import {
  Animated,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  ViewStyle
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { IconProps } from "react-native-vector-icons/Icon";
import { connect } from "react-redux";
import ROUTES from "../../navigation/routes";
import { navigationCurrentRouteSelector } from "../../store/reducers/navigation";
import { GlobalState } from "../../store/reducers/types";
import customVariables from "../../theme/variables";
import { FAQsCategoriesType } from "../../utils/faq";
import { setStatusBarColorAndBackground } from "../../utils/statusBar";
import {
  ContextualHelpProps,
  ContextualHelpPropsMarkdown
} from "./BaseScreenComponent";
import ScreenContent from "./ScreenContent";
import TopScreenComponent from "./TopScreenComponent";
import AnimatedScreenContent from "./AnimatedScreenContent";

type Props = Readonly<{
  accessibilityLabel?: string;
  allowGoBack?: boolean;
  headerBody?: React.ReactNode;
  title?: string;
  icon?: ImageSourcePropType;
  iconFont?: IconProps;
  hideHeader?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  appLogo?: boolean;
  bounces?: boolean;
  topContent?: React.ReactNode;
  hasDynamicSubHeader?: boolean;
  dynamicSubHeader?: React.ReactNode;
  topContentHeight?: number;
  footerContent?: React.ReactNode;
  contextualHelp?: ContextualHelpProps;
  contextualHelpMarkdown?: ContextualHelpPropsMarkdown;
  contentRefreshControl?: Animated.ComponentProps<Content>["refreshControl"];
  faqCategories?: ReadonlyArray<FAQsCategoriesType>;
  customGoBack?: React.ReactNode;
  gradientHeader?: boolean;
  headerPaddingMin?: boolean;
  footerFullWidth?: React.ReactNode;
  navigationCurrentRouteSelector?: ReturnType<
    typeof navigationCurrentRouteSelector
  >;
}>;

const styles = StyleSheet.create({
  headerContents: {
    paddingHorizontal: customVariables.contentPadding
  },
  headerContentsMin: {
    paddingHorizontal: 16
  }
});

class DarkLayout extends React.Component<Props> {
  public componentDidMount() {
    setStatusBarColorAndBackground(
      "light-content",
      customVariables.brandDarkGray
    );
  }

  private screenContent() {
    const wrapper = (children: React.ReactNode) =>
      this.props.gradientHeader ? (
        <LinearGradient
          colors={[customVariables.brandDarkGray, "#42484F"]}
          style={
            this.props.headerPaddingMin
              ? styles.headerContentsMin
              : styles.headerContents
          }
        >
          {children}
        </LinearGradient>
      ) : (
        <View
          style={[
            this.props.headerPaddingMin
              ? styles.headerContentsMin
              : styles.headerContents,
            { backgroundColor: customVariables.brandDarkGray }
          ]}
        >
          {children}
        </View>
      );
    return (
      <React.Fragment>
        {wrapper(
          <React.Fragment>
            <View spacer={true} />
            {this.props.topContent}
          </React.Fragment>
        )}
        {this.props.children}
      </React.Fragment>
    );
  }
  public render() {
    const currentRouteValue: ReturnType<typeof navigationCurrentRouteSelector> = this
      .props.navigationCurrentRouteSelector;

    const isTabBarVisible =
      currentRouteValue.value === ROUTES.MESSAGES_HOME ||
      currentRouteValue.value === ROUTES.WALLET_HOME ||
      currentRouteValue.value === ROUTES.SERVICES_HOME ||
      currentRouteValue.value === ROUTES.PROFILE_MAIN;

    return (
      <TopScreenComponent
        accessibilityLabel={this.props.accessibilityLabel}
        goBack={this.props.allowGoBack}
        customGoBack={this.props.customGoBack}
        headerTitle={this.props.title ? this.props.title : ""}
        dark={true}
        headerBody={this.props.headerBody}
        appLogo={this.props.appLogo}
        contextualHelp={this.props.contextualHelp}
        contextualHelpMarkdown={this.props.contextualHelpMarkdown}
        faqCategories={this.props.faqCategories}
        titleColor={"white"}
      >
        {this.props.hasDynamicSubHeader ? (
          <AnimatedScreenContent
            hideHeader={this.props.hideHeader}
            title={this.props.title ? this.props.title : ""}
            icon={this.props.icon}
            iconFont={this.props.iconFont}
            dark={true}
            contentStyle={this.props.contentStyle}
            dynamicSubHeader={this.props.dynamicSubHeader}
            topContentHeight={
              this.props.topContentHeight ? this.props.topContentHeight : 0
            }
            animationOffset={40}
            contentRefreshControl={this.props.contentRefreshControl}
          >
            {this.screenContent()}
          </AnimatedScreenContent>
        ) : (
          <ScreenContent
            hideHeader={this.props.hideHeader}
            title={this.props.title ? this.props.title : ""}
            icon={this.props.icon}
            iconFont={this.props.iconFont}
            dark={true}
            contentStyle={this.props.contentStyle}
            bounces={
              this.props.bounces ||
              this.props.contentRefreshControl !== undefined
            }
            contentRefreshControl={this.props.contentRefreshControl}
          >
            {this.screenContent()}
          </ScreenContent>
        )}
        {this.props.footerFullWidth}
        {this.props.footerContent && (
          <View
            footer={true}
            style={!isTabBarVisible ? { paddingBottom: 30 } : {}}
          >
            {this.props.footerContent}
          </View>
        )}
      </TopScreenComponent>
    );
  }
}

const mapStateToProps = (state: GlobalState) => ({
  navigationCurrentRouteSelector: navigationCurrentRouteSelector(state)
});

export default connect(mapStateToProps)(DarkLayout);
