import {
  fromNullable,
  fromPredicate,
  none,
  Option,
  some
} from "fp-ts/lib/Option";
import { BugReporting } from "instabug-reactnative";
import { Millisecond } from "italia-ts-commons/lib/units";
import { Container } from "native-base";
import { connectStyle } from "native-base-shoutem-theme";
import mapPropsToStyleNames from "native-base/src/utils/mapPropsToStyleNames";
import * as React from "react";
import { ComponentProps } from "react";
import { ColorValue, ModalBaseProps, Platform } from "react-native";
import { TranslationKeys } from "../../../locales/locales";
import {
  defaultAttachmentTypeConfiguration,
  DefaultReportAttachmentTypeConfiguration,
  instabugLog,
  openInstabugQuestionReport,
  openInstabugReplies,
  setInstabugSupportTokenAttribute,
  TypeLogs
} from "../../boot/configureInstabug";
import I18n from "../../i18n";
import customVariables from "../../theme/variables";
import { setStatusBarColorAndBackground } from "../../utils/statusBar";
import { handleItemOnPress } from "../../utils/url";
import ContextualHelpModal, {
  RequestAssistancePayload
} from "../ContextualHelpModal";
import { SearchType } from "../search/SearchButton";
import Markdown from "../ui/Markdown";
import {
  deriveCustomHandledLink,
  isIoInternalLink
} from "../ui/Markdown/handlers/link";
import { SupportTokenState } from "../../store/reducers/authentication";
import { getValueOrElse } from "../../features/bonus/bpd/model/RemoteValue";
import { SupportToken } from "../../../definitions/backend/SupportToken";
import { AccessibilityEvents, BaseHeader } from "./BaseHeader";

export interface ContextualHelpProps {
  title: string;
  body: () => React.ReactNode;
}

export interface ContextualHelpPropsMarkdown {
  title: TranslationKeys;
  body: TranslationKeys;
}

interface OwnProps {
  onAccessibilityNavigationHeaderFocus?: () => void;
  accessibilityEvents?: AccessibilityEvents;
  accessibilityLabel?: string;
  contextualHelp?: ContextualHelpProps;
  contextualHelpMarkdown?: ContextualHelpPropsMarkdown;
  headerBody?: React.ReactNode;
  headerBackgroundColor?: ColorValue;
  appLogo?: boolean;
  searchType?: SearchType;
  reportAttachmentTypes?: DefaultReportAttachmentTypeConfiguration;

  // As of now, the following prop is propagated through 4 levels
  // to finally display a checkbox in SendSupportRequestOptions
  shouldAskForScreenshotWithInitialValue?: boolean;
}

type Props = OwnProps &
  ComponentProps<typeof BaseHeader> &
  Pick<ComponentProps<typeof ContextualHelpModal>, "faqCategories">;

interface State {
  shouldAttachScreenshotToIBRequest: boolean | undefined;
  isHelpVisible: boolean;
  requestReport: Option<BugReporting.reportType>;
  supportToken?: SupportTokenState;
  markdownContentLoaded: Option<boolean>;
  contextualHelpModalAnimation: ModalBaseProps["animationType"];
}

const maybeDark = fromPredicate(
  (isDark: boolean | undefined = undefined) => isDark === true
);

const ANDROID_OPEN_REPORT_DELAY = 50 as Millisecond;

class BaseScreenComponent extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      shouldAttachScreenshotToIBRequest: undefined,
      contextualHelpModalAnimation: "slide",
      isHelpVisible: false,
      requestReport: none,
      // if the content is markdown we listen for load end event, otherwise the content is
      // assumed always loaded
      markdownContentLoaded: fromNullable(
        this.props.contextualHelpMarkdown
      ).fold<Option<boolean>>(none, _ => some(false))
    };
  }

  private handleOnRequestAssistance = ({
    supportType,
    supportToken,
    shouldSendScreenshot
  }: RequestAssistancePayload) => {
    // don't close modal if the report isn't a bug (bug brings a screenshot)
    if (supportType !== BugReporting.reportType.bug) {
      this.setState(
        { requestReport: some(supportType), supportToken },
        this.handleOnContextualHelpDismissed
      );
      return;
    }
    const contextualHelpModalAnimation = Platform.select<
      ModalBaseProps["animationType"]
    >({
      ios: "slide",
      default: "none"
    });
    this.setState({ contextualHelpModalAnimation }, () => {
      this.setState({ isHelpVisible: false }, () => {
        this.setState(
          {
            requestReport: some(supportType),
            supportToken,
            shouldAttachScreenshotToIBRequest: shouldSendScreenshot
          },
          () => {
            // since in Android we have no way to handle Modal onDismiss event https://reactnative.dev/docs/modal#ondismiss
            // we force handling here. The timeout is due to wait until the modal is completely hidden
            // otherwise in the Instabug screeshoot we will see the contextual help content instead the screen below
            // TODO: To complete the porting to 0.63.x, both iOS and Android will use the timeout. https://www.pivotaltracker.com/story/show/174195300
            setTimeout(
              this.handleOnContextualHelpDismissed,
              ANDROID_OPEN_REPORT_DELAY
            );
            this.setState({ contextualHelpModalAnimation: "slide" });
          }
        );
      });
    });
  };

  private handleOnContextualHelpDismissed = () => {
    const maybeReport = this.state.requestReport;
    this.setState({ requestReport: none }, () => {
      maybeReport.map(type => {
        const supportToken = fromNullable(this.state.supportToken)
          .mapNullable<SupportToken | undefined>(rsp =>
            getValueOrElse(rsp, undefined)
          )
          .getOrElse(undefined);

        // Store/remove and log the support token only if is a new assistance request.
        if (type === BugReporting.reportType.bug) {
          // log on instabug the support token
          if (supportToken) {
            instabugLog(
              JSON.stringify(supportToken),
              TypeLogs.INFO,
              "support-token"
            );
          }
          // set or remove the support token as instabug user attribute
          setInstabugSupportTokenAttribute(supportToken);
        }

        const { reportAttachmentTypes } = this.props;
        const { shouldAttachScreenshotToIBRequest } = this.state;

        // if reportAttachmentTypes is undefined use the default attachment config
        const attachmentConfig: DefaultReportAttachmentTypeConfiguration = {
          ...(reportAttachmentTypes ?? defaultAttachmentTypeConfiguration),
          screenshot: shouldAttachScreenshotToIBRequest ?? true
        };

        switch (type) {
          case BugReporting.reportType.bug:
            openInstabugQuestionReport(attachmentConfig);
            break;
          case BugReporting.reportType.question:
            openInstabugReplies();

            break;
        }
      });
    });
  };

  private showHelp = () => {
    maybeDark(this.props.dark).map(_ =>
      setStatusBarColorAndBackground("dark-content", customVariables.colorWhite)
    );
    this.setState({
      isHelpVisible: true,
      markdownContentLoaded: fromNullable(
        this.props.contextualHelpMarkdown
      ).fold<Option<boolean>>(none, _ => some(false))
    });
  };

  private hideHelp = () => {
    maybeDark(this.props.dark).map(_ =>
      setStatusBarColorAndBackground(
        "light-content",
        customVariables.brandDarkGray
      )
    );
    this.handleOnContextualHelpDismissed();
    this.setState({ isHelpVisible: false });
  };

  private handleOnLinkClicked = (url: string) => {
    // manage links with IO_INTERNAL_LINK_PREFIX as prefix
    if (isIoInternalLink(url)) {
      this.hideHelp();
      return;
    }

    // manage links with IO_CUSTOM_HANDLED_PRESS_PREFIX as prefix
    const customHandledLink = deriveCustomHandledLink(url);
    customHandledLink.map(link => handleItemOnPress(link.url)());
  };

  public render() {
    const {
      accessibilityEvents,
      accessibilityLabel,
      dark,
      appLogo,
      contextualHelp,
      contextualHelpMarkdown,
      goBack,
      headerBody,
      headerTitle,
      headerBackgroundColor,
      primary,
      isSearchAvailable,
      customRightIcon,
      customGoBack,
      onAccessibilityNavigationHeaderFocus,
      showInstabugChat,
      children,
      faqCategories,
      shouldAskForScreenshotWithInitialValue,
      titleColor
    } = this.props;

    const {
      isHelpVisible,
      contextualHelpModalAnimation,
      markdownContentLoaded
    } = this.state;

    const ch = contextualHelp
      ? { body: contextualHelp.body, title: contextualHelp.title }
      : contextualHelpMarkdown
      ? {
          body: () => (
            <Markdown
              onLinkClicked={this.handleOnLinkClicked}
              onLoadEnd={() => {
                this.setState({ markdownContentLoaded: some(true) });
              }}
            >
              {I18n.t(contextualHelpMarkdown.body)}
            </Markdown>
          ),
          title: I18n.t(contextualHelpMarkdown.title)
        }
      : undefined;

    return (
      <Container>
        <BaseHeader
          onAccessibilityNavigationHeaderFocus={
            onAccessibilityNavigationHeaderFocus
          }
          accessibilityEvents={accessibilityEvents}
          accessibilityLabel={accessibilityLabel}
          showInstabugChat={showInstabugChat}
          primary={primary}
          dark={dark}
          goBack={goBack}
          headerTitle={headerTitle}
          backgroundColor={headerBackgroundColor}
          onShowHelp={
            contextualHelp || contextualHelpMarkdown ? this.showHelp : undefined
          }
          isSearchAvailable={isSearchAvailable}
          body={headerBody}
          appLogo={appLogo}
          customRightIcon={customRightIcon}
          customGoBack={customGoBack}
          titleColor={titleColor}
        />
        {children}
        {ch && (
          <ContextualHelpModal
            shouldAskForScreenshotWithInitialValue={
              shouldAskForScreenshotWithInitialValue
            }
            title={ch.title}
            onLinkClicked={this.handleOnLinkClicked}
            body={ch.body}
            isVisible={isHelpVisible}
            modalAnimation={contextualHelpModalAnimation}
            onRequestAssistance={this.handleOnRequestAssistance}
            close={this.hideHelp}
            contentLoaded={markdownContentLoaded.fold(true, s => s)}
            faqCategories={faqCategories}
          />
        )}
      </Container>
    );
  }
}

export default connectStyle(
  "UIComponent.BaseScreenComponent",
  {},
  mapPropsToStyleNames
)(BaseScreenComponent);
