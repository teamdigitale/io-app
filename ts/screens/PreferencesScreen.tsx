import { Body, Container, Content, H1, List, Text, View } from "native-base";
import * as React from "react";
import { Alert } from "react-native";
import DeviceInfo from "react-native-device-info";
import { connect } from "react-redux";

import { fromNullable, Option } from "fp-ts/lib/Option";

import { untag } from "italia-ts-commons/lib/types";

import I18n from "../i18n";

import { FetchRequestActions } from "../store/actions/constants";
import { ReduxProps } from "../store/actions/types";
import { createErrorSelector } from "../store/reducers/error";
import { createLoadingSelector } from "../store/reducers/loading";
import { GlobalState } from "../store/reducers/types";

import PreferenceItem from "../components/PreferenceItem";
import ScreenHeader from "../components/ScreenHeader";
import AppHeader from "../components/ui/AppHeader";

import { ProfileWithOrWithoutEmail } from "../api/backend";
import { getLocalePrimary } from "../utils/locale";

type ReduxMappedProps = {
  maybeProfile: Option<ProfileWithOrWithoutEmail>;
  isProfileLoading: boolean;
  isProfileLoadingError: Option<string>;
  isProfileUpserting: boolean;
  isProfileUpsertingError: Option<string>;
  languages: Option<ReadonlyArray<string>>;
};

export type Props = ReduxMappedProps & ReduxProps;

/**
 * Translates the primary languages of the provided locales.
 *
 * If a locale is not in the XX-YY format, it will be skipped.
 * If the primary language of a locale doesn't have a translation,
 * it gets returned verbatim.
 */
function translateLocales(
  locales: ReadonlyArray<string>
): ReadonlyArray<string> {
  return locales
    .map(_ =>
      getLocalePrimary(_)
        .map(l => I18n.t(`locales.${l}`, { defaultValue: l }))
        .getOrElse("")
    )
    .filter(_ => _.length > 0);
}

/**
 * Implements the preferences screen where the user can see and update his
 * email, mobile number, preferred language and digital address.
 */
class PreferencesScreen extends React.Component<Props> {
  public render() {
    const maybeProfile = this.props.maybeProfile;

    const profileData = maybeProfile
      .map(_ => ({
        spid_email: untag(_.spid_email),
        spid_mobile_phone: untag(_.spid_mobile_phone)
      }))
      .getOrElse({
        spid_email: I18n.t("remoteStates.notAvailable"),
        spid_mobile_phone: I18n.t("remoteStates.notAvailable")
      });

    const languages = this.props.languages
      .filter(_ => _.length > 0)
      .map(_ => translateLocales(_).join(", "))
      .getOrElse(I18n.t("remoteStates.notAvailable"));

    return (
      <Container>
        <AppHeader>
          <Body>
            <Text>{DeviceInfo.getApplicationName()}</Text>
          </Body>
        </AppHeader>

        <Content>
          <View>
            <ScreenHeader
              heading={<H1>{I18n.t("preferences.title")}</H1>}
              icon={require("../../img/icons/gears.png")}
            />

            <Text>{I18n.t("preferences.subtitle")}</Text>
            <Text link={true}>{I18n.t("preferences.moreLinkText")}</Text>

            <View spacer={true} />
            <View>
              <List>
                <PreferenceItem
                  kind="value"
                  title={I18n.t("preferences.list.email")}
                  icon="email"
                  valuePreview={profileData.spid_email}
                />
                <PreferenceItem
                  kind="value"
                  title={I18n.t("preferences.list.mobile_phone")}
                  icon="phone-number"
                  valuePreview={profileData.spid_mobile_phone}
                />
                <PreferenceItem
                  kind="action"
                  title={I18n.t("preferences.list.services")}
                  valuePreview={I18n.t("preferences.list.services_description")}
                  onClick={() => {
                    Alert.alert("Not implemented yet");
                  }}
                />
                <PreferenceItem
                  kind="value"
                  title={I18n.t("preferences.list.language")}
                  icon="languages"
                  valuePreview={languages}
                />
              </List>
            </View>
          </View>
        </Content>
      </Container>
    );
  }
}

const mapStateToProps = (state: GlobalState): ReduxMappedProps => ({
  languages: fromNullable(state.preferences.languages),
  maybeProfile: fromNullable(state.profile),
  isProfileLoading: createLoadingSelector([FetchRequestActions.PROFILE_LOAD])(
    state
  ),
  isProfileLoadingError: createErrorSelector([
    FetchRequestActions.PROFILE_LOAD
  ])(state),
  isProfileUpserting: createLoadingSelector([
    FetchRequestActions.PROFILE_UPSERT
  ])(state),
  isProfileUpsertingError: createErrorSelector([
    FetchRequestActions.PROFILE_UPSERT
  ])(state)
});

export default connect(mapStateToProps)(PreferencesScreen);
