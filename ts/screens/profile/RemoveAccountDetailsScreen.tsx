import * as pot from "italia-ts-commons/lib/pot";
import { Content, View } from "native-base";
import * as React from "react";
import { Alert, SafeAreaView } from "react-native";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { RadioButtonList } from "../../components/core/selection/RadioButtonList";
import { H1 } from "../../components/core/typography/H1";
import { H4 } from "../../components/core/typography/H4";
import { IOStyles } from "../../components/core/variables/IOStyles";
import { LabelledItem } from "../../components/LabelledItem";
import BaseScreenComponent from "../../components/screens/BaseScreenComponent";
import FooterWithButtons from "../../components/ui/FooterWithButtons";
import { shufflePinPadOnPayment } from "../../config";
import { LoadingErrorComponent } from "../../features/bonus/bonusVacanze/components/loadingErrorScreen/LoadingErrorComponent";
import { allBonusActiveSelector } from "../../features/bonus/bonusVacanze/store/reducers/allActive";
import { bpdEnabledSelector } from "../../features/bonus/bpd/store/reducers/details/activation";
import I18n from "../../i18n";
import { identificationRequest } from "../../store/actions/identification";
import { navigateToWalletHome } from "../../store/actions/navigation";
import {
  removeAccountMotivation,
  RemoveAccountMotivationEnum,
  RemoveAccountMotivationPayload
} from "../../store/actions/profile";
import { ReduxProps } from "../../store/actions/types";
import { GlobalState } from "../../store/reducers/types";
import { userDataProcessingSelector } from "../../store/reducers/userDataProcessing";
import { withKeyboard } from "../../utils/keyboard";

type Props = ReduxProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>;

const getMotivationItems = (): ReadonlyArray<{
  label: string;
  id: RemoveAccountMotivationEnum;
}> => [
  {
    label: I18n.t("profile.main.privacy.removeAccount.details.answer_1"),
    id: RemoveAccountMotivationEnum.NOT_UTILS
  },
  {
    label: I18n.t("profile.main.privacy.removeAccount.details.answer_2"),
    id: RemoveAccountMotivationEnum.NOT_SAFE
  },
  {
    label: I18n.t("profile.main.privacy.removeAccount.details.answer_3"),
    id: RemoveAccountMotivationEnum.NEVER_USED
  },
  {
    label: I18n.t("profile.main.privacy.removeAccount.details.answer_4"),
    id: RemoveAccountMotivationEnum.OTHERS
  }
];
/**
 * A screen that ask user the motivation of the account removal
 * Here user can ask to delete his account
 */
const RemoveAccountDetails: React.FunctionComponent<Props> = (props: Props) => {
  // Initially no motivation is selected
  const [selectedMotivation, setSelectedMotivation] = React.useState<
    RemoveAccountMotivationEnum
  >(RemoveAccountMotivationEnum.UNDEFINED);

  const [otherMotivation, setOtherMotivation] = React.useState<string>("");

  const handleContinuePress = () => {
    const hasActiveBonus =
      props.bvActiveBonus || pot.getOrElse(props.bpdActiveBonus, false);

    if (hasActiveBonus) {
      Alert.alert(
        I18n.t("profile.main.privacy.removeAccount.alert.activeBonusTitle"),
        I18n.t(
          "profile.main.privacy.removeAccount.alert.activeBonusDescription"
        ),
        [
          {
            text: I18n.t(
              "profile.main.privacy.removeAccount.alert.cta.manageBonus"
            ),
            style: "default",
            onPress: props.navigateToWalletHomeScreen
          },
          {
            text: I18n.t(
              "profile.main.privacy.removeAccount.alert.cta.continue"
            ),
            style: "cancel",
            onPress: () => {
              handleSendMotivation(selectedMotivation);
            }
          }
        ]
      );
    } else {
      handleSendMotivation(selectedMotivation);
    }
  };

  const handleSendMotivation = (
    selectedMotivation: RemoveAccountMotivationEnum
  ) => {
    switch (selectedMotivation) {
      case RemoveAccountMotivationEnum.OTHERS:
        // Only the "others" reason allow to insert a custom text
        props.requestIdentification({
          reason: selectedMotivation,
          userText: otherMotivation
        });
        break;
      default:
        props.requestIdentification({ reason: selectedMotivation });
    }
  };
  const continueButtonProps = {
    block: true,
    primary: true,
    onPress: handleContinuePress,
    title: I18n.t("profile.main.privacy.removeAccount.info.cta")
  };

  const loadingCaption = I18n.t(
    "profile.main.privacy.removeAccount.success.title"
  );
  return (
    <BaseScreenComponent
      goBack={true}
      headerTitle={I18n.t("profile.main.title")}
    >
      {props.isLoading || props.isError ? (
        <LoadingErrorComponent
          isLoading={props.isLoading}
          loadingCaption={loadingCaption}
          onRetry={() => {
            props.onIdentificationSuccess({
              reason: selectedMotivation,
              userText: otherMotivation
            });
          }}
        />
      ) : (
        <SafeAreaView style={IOStyles.flex}>
          <Content>
            <H1>{I18n.t("profile.main.privacy.removeAccount.title")}</H1>
            <H4 weight="Regular">
              {I18n.t("profile.main.privacy.removeAccount.details.body")}
            </H4>
            <View style={{ paddingTop: 25 }}>
              <RadioButtonList<RemoveAccountMotivationEnum>
                head={I18n.t(
                  "profile.main.privacy.removeAccount.details.question"
                )}
                key="delete_reason"
                items={getMotivationItems()}
                selectedItem={selectedMotivation}
                onPress={setSelectedMotivation}
              />
              {selectedMotivation === RemoveAccountMotivationEnum.OTHERS && (
                <LabelledItem
                  type="text"
                  label={I18n.t(
                    "profile.main.privacy.removeAccount.details.labelOpenAnswer"
                  )}
                  inputProps={{
                    keyboardType: "default",
                    returnKeyType: "done",
                    autoFocus: true,
                    maxLength: 18,
                    onChangeText: setOtherMotivation
                  }}
                />
              )}
            </View>
          </Content>
          {withKeyboard(
            <FooterWithButtons
              type={"SingleButton"}
              leftButton={continueButtonProps}
            />,
            true
          )}
        </SafeAreaView>
      )}
    </BaseScreenComponent>
  );
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  const onIdentificationSuccess = (
    motivationPayload: RemoveAccountMotivationPayload
  ) => dispatch(removeAccountMotivation(motivationPayload));

  return {
    onIdentificationSuccess,
    requestIdentification: (
      motivationPayload: RemoveAccountMotivationPayload
    ) =>
      dispatch(
        identificationRequest(
          false,
          true,
          {
            message: I18n.t("wallet.ConfirmPayment.identificationMessage")
          },
          {
            label: I18n.t("wallet.ConfirmPayment.cancelPayment"),
            onCancel: () => undefined
          },
          {
            onSuccess: () => onIdentificationSuccess(motivationPayload)
          },
          shufflePinPadOnPayment
        )
      ),
    navigateToWalletHomeScreen: () => dispatch(navigateToWalletHome())
  };
};

const mapStateToProps = (state: GlobalState) => {
  const bpdActiveBonus = bpdEnabledSelector(state);
  const bvActiveBonus = allBonusActiveSelector(state).length > 0;
  const userDataProcessing = userDataProcessingSelector(state);
  const isLoading =
    pot.isLoading(userDataProcessing.DELETE) ||
    pot.isUpdating(userDataProcessing.DELETE);
  const isError = pot.isError(userDataProcessing.DELETE);
  return {
    bvActiveBonus,
    bpdActiveBonus,
    userDataProcessing,
    isLoading,
    isError
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RemoveAccountDetails);
