import { fromNullable } from "fp-ts/lib/Option";
import { Millisecond } from "italia-ts-commons/lib/units";
import { Body, Left, Right, Text, View } from "native-base";
import * as React from "react";
import { FC, Ref } from "react";
import { AccessibilityInfo, ColorValue, StyleSheet } from "react-native";
import { NavigationEvents } from "react-navigation";
import { connect } from "react-redux";
import IconFont from "../../components/ui/IconFont";
import { navigateBack } from "../../store/actions/navigation";
import { Dispatch } from "../../store/actions/types";
import { isPagoPATestEnabledSelector } from "../../store/reducers/persistedPreferences";
import { isSearchEnabledSelector } from "../../store/reducers/search";
import { GlobalState } from "../../store/reducers/types";
import variables from "../../theme/variables";
import { setAccessibilityFocus } from "../../utils/accessibility";
import { maybeNotNullyString } from "../../utils/strings";
import ButtonDefaultOpacity from "../ButtonDefaultOpacity";
import GoBackButton from "../GoBackButton";
import InstabugChatsComponent from "../InstabugChatsComponent";
import SearchButton, { SearchType } from "../search/SearchButton";
import AppHeader from "../ui/AppHeader";
import I18n from "../../i18n";
import { IOColors, IOColorType } from "../core/variables/IOColors";

type HelpButtonProps = {
  onShowHelp: () => void;
};

const styles = StyleSheet.create({
  noLeft: {
    marginLeft: variables.contentPadding - variables.appHeaderPaddingHorizontal
  },
  body: {
    alignItems: "center"
  },
  helpButton: {
    padding: 8
  }
});

const HelpButton: FC<HelpButtonProps> = ({ onShowHelp }) => (
  <ButtonDefaultOpacity
    hasFullHitSlop
    onPress={onShowHelp}
    transparent={true}
    accessibilityLabel={I18n.t(
      "global.accessibility.contextualHelp.open.label"
    )}
    style={styles.helpButton}
    accessibilityHint={I18n.t("global.accessibility.contextualHelp.open.hint")}
  >
    <IconFont name={"io-question"} />
  </ButtonDefaultOpacity>
);

export type AccessibilityEvents = {
  avoidNavigationEventsUsage?: boolean; // if true NavigationEvents won't be included and the focus will be done on componentDidMount
  disableAccessibilityFocus?: boolean; // if true the setAccessibilityFocus is not triggered
};

interface OwnProps {
  onAccessibilityNavigationHeaderFocus?: () => void;
  accessibilityEvents?: AccessibilityEvents;
  accessibilityLabel?: string; // rendered only if it is defined and a screen reader is active
  dark?: boolean; // Used only for Icons color TODO Think to use titleColor as unique prop for icons color too
  headerTitle?: string;
  backgroundColor?: ColorValue;
  goBack?: React.ComponentProps<typeof GoBackButton>["goBack"];
  primary?: boolean; // Used only for Icons color TODO Think to use titleColor as unique prop for icons color too
  appLogo?: boolean;
  onShowHelp?: () => void;
  // A property to set a custom AppHeader body
  body?: React.ReactNode;
  isSearchAvailable?: {
    enabled: true;
    searchType?: SearchType;
    onSearchTap?: () => void;
  };
  showInstabugChat?: boolean;
  customRightIcon?: {
    iconName: string;
    onPress: () => void;
    accessibilityLabel?: string;
  };
  customGoBack?: React.ReactNode;
  titleColor?: IOColorType;
}

type Props = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>;
type State = {
  isScreenReaderActive: boolean;
  isMounted: boolean;
};
const setAccessibilityTimeout = 0 as Millisecond;
const noReferenceTimeout = 150 as Millisecond;
/** A component representing the properties common to all the screens (and the most of modal/overlay displayed) */
class BaseHeaderComponent extends React.PureComponent<Props, State> {
  private firstElementRef = React.createRef<View>();

  public constructor(props: Props) {
    super(props);
    this.handleFocus = this.handleFocus.bind(this);
    this.state = { isScreenReaderActive: false, isMounted: false };
  }

  // set accessibility focus when component is mounted
  // it should be used paired with avoidNavigationEvents === true (navigation context not available)
  public componentDidMount() {
    this.setState({isMounted: true});
    void AccessibilityInfo.isScreenReaderEnabled()
      .then(isScreenReaderActive => {
        if (this.state.isMounted) {
          this.setState({ isScreenReaderActive });
        }
        
        if (
          isScreenReaderActive &&
          fromNullable(this.props.accessibilityEvents).fold(
            false,
            ({ avoidNavigationEventsUsage }) => avoidNavigationEventsUsage
          )
        ) {
          this.handleFocus();
        }
      })
      .catch(); // do nothing
  }

  public componentWillUnmount() {
    this.setState({ isMounted: false });
  }

  get canHandleFocus() {
    return fromNullable(this.props.accessibilityEvents).fold(
      true,
      ae => ae.disableAccessibilityFocus !== true
    );
  }

  // set accessibility focus when this view comes visible
  public handleFocus() {
    if (!this.canHandleFocus) {
      return;
    }
    setTimeout(() => {
      // retry until the reference is defined
      if (this.firstElementRef === undefined) {
        this.handleFocus();
        return;
      }
      setAccessibilityFocus(
        this.firstElementRef,
        setAccessibilityTimeout,
        this.props.onAccessibilityNavigationHeaderFocus
      );
    }, noReferenceTimeout);
  }

  private renderBodyLabel = (label?: string, ref?: Ref<Text>) =>
    maybeNotNullyString(label).fold(undefined, l => {
      const { titleColor } = this.props;
      return (
        <Text
          ref={ref}
          numberOfLines={1}
          accessible={true}
          accessibilityRole={"header"}
          style={{
            color: titleColor ? IOColors[titleColor] : IOColors.bluegrey
          }}
        >
          {l}
        </Text>
      );
    });

  public render() {
    const {
      goBack,
      customGoBack,
      headerTitle,
      backgroundColor,
      body,
      isSearchEnabled,
      dark,
      accessibilityLabel
    } = this.props;

    const maybeAccessibilityLabel = maybeNotNullyString(accessibilityLabel);
    return (
      <AppHeader
        backgroundColor={backgroundColor}
        primary={this.props.primary}
        noShadow={isSearchEnabled}
        dark={dark}
      >
        {this.renderLeft()}

        {/* if screen reader is active and the accessibility label is defined, render the accessibility label
          as placeholder where force focus
        */}
        {!isSearchEnabled && (
          <Body style={[goBack || customGoBack ? styles.body : styles.noLeft]}>
            {this.state.isScreenReaderActive &&
            maybeAccessibilityLabel.isSome() ? (
              this.renderBodyLabel(
                maybeAccessibilityLabel.value,
                this.firstElementRef
              )
            ) : (
              <View ref={this.firstElementRef} accessible={true}>
                {body ? body : headerTitle && this.renderBodyLabel(headerTitle)}
              </View>
            )}
          </Body>
        )}

        {this.renderRight()}

        {fromNullable(this.props.accessibilityEvents).fold(
          true,
          ({ avoidNavigationEventsUsage }) => !avoidNavigationEventsUsage
        ) && <NavigationEvents onDidFocus={this.handleFocus} />}
      </AppHeader>
    );
  }

  private renderRight = () => {
    const {
      isSearchEnabled,
      onShowHelp,
      isSearchAvailable,
      showInstabugChat,
      customRightIcon
    } = this.props;

    return (
      <Right>
        {isSearchAvailable?.enabled && (
          <SearchButton
            searchType={isSearchAvailable.searchType}
            onSearchTap={isSearchAvailable.onSearchTap}
          />
        )}
        {!isSearchEnabled && showInstabugChat !== false && (
          <InstabugChatsComponent />
        )}
        {onShowHelp && !isSearchEnabled && (
          <HelpButton onShowHelp={onShowHelp} />
        )}

        {customRightIcon && !isSearchEnabled && (
          <ButtonDefaultOpacity
            onPress={customRightIcon.onPress}
            transparent={true}
            accessible={customRightIcon.accessibilityLabel !== undefined}
            accessibilityLabel={customRightIcon.accessibilityLabel}
          >
            <IconFont name={customRightIcon.iconName} />
          </ButtonDefaultOpacity>
        )}
        {!onShowHelp &&
          !customRightIcon &&
          showInstabugChat === false &&
          !isSearchEnabled && <View hspacer={true} extralarge={true} />}
        {fromNullable(this.props.accessibilityEvents).fold(
          true,
          ({ avoidNavigationEventsUsage }) => !avoidNavigationEventsUsage
        ) && <NavigationEvents onDidFocus={this.handleFocus} />}
      </Right>
    );
  };

  private renderGoBack = () => {
    const { goBack, dark, customGoBack } = this.props;
    return customGoBack ? (
      <Left>{customGoBack}</Left>
    ) : (
      goBack && (
        <Left>
          <GoBackButton testID={"back-button"} onPress={goBack} white={dark} />
        </Left>
      )
    );
  };

  private renderLeft = () => {
    const {
      isSearchEnabled,
      appLogo,
      primary,
      dark,
      isPagoPATestEnabled
    } = this.props;

    const iconColor = isPagoPATestEnabled
      ? variables.brandHighlight
      : primary || dark
      ? variables.colorWhite
      : variables.brandPrimary;

    return (
      !isSearchEnabled &&
      (appLogo ? (
        <Left>
          <View
            accessible={true}
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
          >
            <IconFont name={"io-logo"} color={iconColor} accessible={false} />
          </View>
        </Left>
      ) : (
        this.renderGoBack()
      ))
    );
  };
}

const mapStateToProps = (state: GlobalState) => ({
  isSearchEnabled: isSearchEnabledSelector(state),
  isPagoPATestEnabled: isPagoPATestEnabledSelector(state)
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  navigateBack: () => {
    dispatch(navigateBack());
  }
});

export const BaseHeader = connect(
  mapStateToProps,
  mapDispatchToProps
)(BaseHeaderComponent);
