/**
 * A screen where user after login (with CIE) can set email address if it is
 * not present in the profile.
 */
import { none, Option, some } from "fp-ts/lib/Option";
import * as pot from "italia-ts-commons/lib/pot";
import { EmailString } from "italia-ts-commons/lib/strings";
import { Content, Form, Text, View } from "native-base";
import * as React from "react";
import { Alert, Keyboard, Platform, StyleSheet } from "react-native";
import { NavigationScreenProps, StackActions } from "react-navigation";
import { connect } from "react-redux";
import { withLoadingSpinner } from "../../components/helpers/withLoadingSpinner";
import { LabelledItem } from "../../components/LabelledItem";
import BaseScreenComponent, {
  ContextualHelpPropsMarkdown
} from "../../components/screens/BaseScreenComponent";
import FooterWithButtons from "../../components/ui/FooterWithButtons";
import H4 from "../../components/ui/H4";
import I18n from "../../i18n";
import { navigateToEmailReadScreen } from "../../store/actions/navigation";
import {
  abortOnboarding,
  emailAcknowledged,
  emailInsert
} from "../../store/actions/onboarding";
import { profileLoadRequest, profileUpsert } from "../../store/actions/profile";
import { Dispatch, ReduxProps } from "../../store/actions/types";
import { isOnboardingCompletedSelector } from "../../store/reducers/navigationHistory";
import {
  isProfileEmailValidatedSelector,
  profileEmailSelector,
  profileSelector
} from "../../store/reducers/profile";
import { GlobalState } from "../../store/reducers/types";
import customVariables from "../../theme/variables";
import { areStringsEqual } from "../../utils/options";
import { showToast } from "../../utils/showToast";
import { withKeyboard } from "../../utils/keyboard";

type Props = ReduxProps &
  ReturnType<typeof mapDispatchToProps> &
  ReturnType<typeof mapStateToProps> &
  NavigationScreenProps;

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  horizontalPadding: {
    paddingHorizontal: customVariables.contentPadding
  },
  boldH4: {
    fontWeight: customVariables.textBoldWeight,
    paddingTop: customVariables.spacerLargeHeight
  },
  icon: {
    marginTop: Platform.OS === "android" ? 4 : 6 // adjust icon position to align it with baseline of email text}
  },
  darkestGray: {
    color: customVariables.brandDarkestGray
  }
});

const EMPTY_EMAIL = "";

type State = Readonly<{
  email: Option<string>;
  isMounted: boolean;
}>;

// TODO: update content (https://www.pivotaltracker.com/n/projects/2048617/stories/169392558)
const contextualHelpMarkdown: ContextualHelpPropsMarkdown = {
  title: "email.insert.help.title",
  body: "email.insert.help.content"
};

/**
 * A screen to allow user to insert an email address.
 */
class EmailInsertScreen extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { email: this.props.optionEmail, isMounted: true };
  }

  private continueOnPress = () => {
    Keyboard.dismiss();
    if (this.isValidEmail()) {
      // The profile is reloaded to check if the user email
      // has been updated within another session
      this.props.reloadProfile();
    }
  };

  private renderFooterButtons = () => {
    const continueButtonProps = {
      disabled: this.isValidEmail() !== true && !this.props.isLoading,
      onPress: this.continueOnPress,
      title: I18n.t("global.buttons.continue"),
      block: true,
      primary: this.isValidEmail()
    };

    return (
      <FooterWithButtons
        type={"SingleButton"}
        leftButton={continueButtonProps}
      />
    );
  };

  /** validate email returning three possible values:
   * - _true_,      if email is valid.
   * - _false_,     if email has been already changed from the user and it is not
   * valid.
   * - _undefined_, if email field is empty. This state is consumed by
   * LabelledItem Component and it used for style pourposes ONLY.
   */
  private isValidEmail = () =>
    this.state.email
      .map(value => {
        if (EMPTY_EMAIL === value) {
          return undefined;
        }
        return EmailString.decode(value).isRight();
      })
      .toUndefined();

  private handleOnChangeEmailText = (value: string) => {
    this.setState({
      email: value !== EMPTY_EMAIL ? some(value) : none
    });
  };

  private handleGoBack = () => {
    // goback if the onboarding is completed
    if (this.props.isOnboardingCompleted) {
      this.props.navigation.goBack();
    }
    // if the onboarding is not completed and the email is set, force goback with a reset (user could edit his email and go back without saving)
    // see https://www.pivotaltracker.com/story/show/171424350
    else if (this.props.optionEmail.isSome()) {
      this.setState({ isMounted: false }, () => {
        this.navigateToEmailReadScreen();
      });
    } else {
      // if the user is in onboarding phase, go back has to
      // abort login (an user with no email can't access the home)
      Alert.alert(
        I18n.t("onboarding.alert.title"),
        I18n.t("onboarding.alert.description"),
        [
          {
            text: I18n.t("global.buttons.cancel"),
            style: "cancel"
          },
          {
            text: I18n.t("global.buttons.exit"),
            style: "default",
            onPress: this.props.abortOnboarding
          }
        ]
      );
    }
  };

  private navigateToEmailReadScreen = () => {
    const resetAction = StackActions.reset({
      index: 0,
      actions: [navigateToEmailReadScreen()]
    });
    this.props.navigation.dispatch(resetAction);
  };

  public componentDidMount() {
    if (this.props.isOnboardingCompleted) {
      this.setState({ email: some(EMPTY_EMAIL) });
    }
  }

  public componentDidUpdate(prevProps: Props) {
    const isPrevCurrentSameState =
      prevProps.profile.kind === this.props.profile.kind;
    // do nothing if prev profile is in the same state of the current
    if (!this.state.isMounted || isPrevCurrentSameState) {
      return;
    }
    // if we were updating the profile
    if (pot.isUpdating(prevProps.profile)) {
      // and we got an error
      if (pot.isError(this.props.profile)) {
        // display a toast with error
        showToast(I18n.t("email.edit.upsert_ko"), "danger");
      } else if (pot.isSome(this.props.profile)) {
        // user is inserting his email from onboarding phase
        // he comes from checkAcknowledgedEmailSaga if onboarding is not finished yet
        // and he has not an email
        if (
          !this.props.isOnboardingCompleted &&
          prevProps.optionEmail.isNone()
        ) {
          // since this screen is mounted from saga it won't be unmounted because on saga
          // we have a direct navigation instead of back
          // so we have to force a reset (to get this screen unmounted) and navigate to emailReadScreen
          // isMounted is used as a guard to prevent update while the screen is unmounting
          this.setState({ isMounted: false }, () => {
            this.props.acknowledgeEmailInsert();
            this.navigateToEmailReadScreen();
          });
          return;
        }
        // go back (to the EmailReadScreen)
        this.handleGoBack();
        return;
      }
    }

    // When the profile reload is completed, check if the email is changed since the last reload
    if (
      pot.isLoading(prevProps.profile) &&
      !pot.isLoading(this.props.profile)
    ) {
      // Check both if the email has been changed within another session and
      // if the inserted email match with the email stored into the user profile
      const isTheSameEmail = areStringsEqual(
        this.props.optionEmail,
        this.state.email,
        true
      );
      if (!isTheSameEmail) {
        this.state.email.map(e => {
          this.props.updateEmail(e as EmailString);
        });
      } else {
        Alert.alert(I18n.t("email.insert.alert"));
      }
    }
  }

  public render() {
    const isFromProfileSection = this.props.isOnboardingCompleted;
    return (
      <BaseScreenComponent
        goBack={this.handleGoBack}
        headerTitle={
          isFromProfileSection
            ? I18n.t("profile.data.list.email")
            : I18n.t("email.insert.header")
        }
        contextualHelpMarkdown={contextualHelpMarkdown}
      >
        <View style={styles.flex}>
          <Content noPadded={true} style={styles.flex} scrollEnabled={false}>
            <H4 style={[styles.boldH4, styles.horizontalPadding]}>
              {isFromProfileSection
                ? I18n.t("email.edit.title")
                : I18n.t("email.insert.title")}
            </H4>
            <View spacer={true} />
            <View style={styles.horizontalPadding}>
              <Text>
                {isFromProfileSection
                  ? this.props.isEmailValidated
                    ? I18n.t("email.edit.validated")
                    : I18n.t("email.edit.subtitle")
                  : I18n.t("email.insert.subtitle")}
                {isFromProfileSection && (
                  <Text style={styles.darkestGray}>
                    {` ${this.props.optionEmail.getOrElse("")}`}
                  </Text>
                )}
              </Text>
            </View>
            <View spacer={true} />
            <View style={styles.horizontalPadding}>
              <Form>
                <LabelledItem
                  type={"text"}
                  label={
                    isFromProfileSection
                      ? I18n.t("email.edit.label")
                      : I18n.t("email.insert.label")
                  }
                  icon="io-envelope"
                  isValid={this.isValidEmail()}
                  inputProps={{
                    returnKeyType: "done",
                    onSubmitEditing: this.continueOnPress,
                    autoCapitalize: "none",
                    keyboardType: "email-address",
                    value: this.state.email.getOrElse(EMPTY_EMAIL),
                    onChangeText: this.handleOnChangeEmailText
                  }}
                  iconStyle={styles.icon}
                />
              </Form>
            </View>
          </Content>
        </View>

        {withKeyboard(this.renderFooterButtons())}
      </BaseScreenComponent>
    );
  }
}

function mapStateToProps(state: GlobalState) {
  const profile = profileSelector(state);
  return {
    profile,
    optionEmail: profileEmailSelector(state),
    isEmailValidated: isProfileEmailValidatedSelector(state),
    isLoading: pot.isUpdating(profile) || pot.isLoading(profile),
    isOnboardingCompleted: isOnboardingCompletedSelector(state)
  };
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  updateEmail: (email: EmailString) =>
    dispatch(
      profileUpsert.request({
        email
      })
    ),
  navigateToEmailReadScreen: () => {
    dispatch(navigateToEmailReadScreen());
  },
  acknowledgeEmailInsert: () => dispatch(emailInsert()),
  acknowledgeEmail: () => dispatch(emailAcknowledged()),
  abortOnboarding: () => dispatch(abortOnboarding()),
  reloadProfile: () => dispatch(profileLoadRequest())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withLoadingSpinner(EmailInsertScreen));
