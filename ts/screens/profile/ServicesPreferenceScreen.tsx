import * as React from "react";
import { ScrollView } from "react-native";
import { connect } from "react-redux";
import * as pot from "italia-ts-commons/lib/pot";
import BaseScreenComponent from "../../components/screens/BaseScreenComponent";
import { emptyContextualHelp } from "../../utils/emptyContextualHelp";
import { IOStyles } from "../../components/core/variables/IOStyles";
import { GlobalState } from "../../store/reducers/types";
import { Dispatch } from "../../store/actions/types";
import I18n from "../../i18n";
import { ServicesPreferencesModeEnum } from "../../../definitions/backend/ServicesPreferencesMode";
import { profileUpsert } from "../../store/actions/profile";
import {
  profileSelector,
  profileServicePreferencesModeSelector
} from "../../store/reducers/profile";
import { withLoadingSpinner } from "../../components/helpers/withLoadingSpinner";
import { showToast } from "../../utils/showToast";
import { isStrictSome } from "../../utils/pot";
import { mixpanelTrack } from "../../mixpanel";
import ServicesContactComponent from "./components/services/ServicesContactComponent";
import { useManualConfigBottomSheet } from "./components/services/ManualConfigBottomSheet";

type Props = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>;

/**
 * Display the current profile services preference mode (auto or manual)
 * User can update his/her mode
 * @param props
 * @constructor
 */
const ServicesPreferenceScreen = (props: Props): React.ReactElement => {
  const { present: confirmManualConfig } = useManualConfigBottomSheet();
  const [prevPotProfile, setPrevPotProfile] = React.useState<
    typeof props.potProfile
  >(props.potProfile);
  React.useEffect(() => {
    // show error toast only when the profile updating fails
    // otherwise, if the profile is in error state, the toast will be shown immediately without any updates
    if (!pot.isError(prevPotProfile) && pot.isError(props.potProfile)) {
      showToast(I18n.t("global.genericError"));
    }

    if (
      isStrictSome(prevPotProfile) &&
      isStrictSome(props.potProfile) &&
      prevPotProfile.value.service_preferences_settings !==
        props.potProfile.value.service_preferences_settings
    ) {
      void mixpanelTrack("SERVICE_CONTACT_MODE_SET", {
        mode: props.potProfile.value.service_preferences_settings
      });
    }
    setPrevPotProfile(props.potProfile);
  }, [props.potProfile]);

  const handleOnSelectMode = (mode: ServicesPreferencesModeEnum) => {
    // if user's choice is 'manual', open bottom sheet to ask confirmation
    if (mode === ServicesPreferencesModeEnum.MANUAL) {
      void confirmManualConfig(() =>
        props.onServicePreferenceSelected(ServicesPreferencesModeEnum.MANUAL)
      );
      return;
    }
    props.onServicePreferenceSelected(mode);
  };

  return (
    <BaseScreenComponent
      goBack={true}
      contextualHelp={emptyContextualHelp}
      headerTitle={I18n.t("profile.preferences.list.service_contact")}
    >
      <ScrollView style={[IOStyles.flex, IOStyles.horizontalContentPadding]}>
        <ServicesContactComponent
          onSelectMode={handleOnSelectMode}
          mode={props.profileServicePreferenceMode}
        />
      </ScrollView>
    </BaseScreenComponent>
  );
};

const mapStateToProps = (state: GlobalState) => {
  const profile = profileSelector(state);
  return {
    isLoading: pot.isUpdating(profile) || pot.isLoading(profile),
    potProfile: profile,
    profileServicePreferenceMode: profileServicePreferencesModeSelector(state)
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  onServicePreferenceSelected: (mode: ServicesPreferencesModeEnum) =>
    dispatch(profileUpsert.request({ service_preferences_settings: { mode } }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withLoadingSpinner(ServicesPreferenceScreen));
