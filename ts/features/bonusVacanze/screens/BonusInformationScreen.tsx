import { fromNullable } from "fp-ts/lib/Option";
import * as pot from "italia-ts-commons/lib/pot";
import { Content, Text, View } from "native-base";
import * as React from "react";
import { Image, StyleSheet } from "react-native";
import { NavigationInjectedProps } from "react-navigation";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { withLoadingSpinner } from "../../../components/helpers/withLoadingSpinner";
import BaseScreenComponent from "../../../components/screens/BaseScreenComponent";
import { EdgeBorderComponent } from "../../../components/screens/EdgeBorderComponent";
import FooterWithButtons from "../../../components/ui/FooterWithButtons";
import Markdown from "../../../components/ui/Markdown";
import I18n from "../../../i18n";
import { navigateBack } from "../../../store/actions/navigation";
import { serviceByIdSelector } from "../../../store/reducers/entities/services/servicesById";
import { GlobalState } from "../../../store/reducers/types";
import { navigateToBonusTosScreen } from "../navigation/action";
import { BonusAvailable } from "../types/bonusesAvailable";
import { logosForService } from "../../../utils/services";
import { MultiImage } from "../../../components/ui/MultiImage";
import customVariables from "../../../theme/variables";
import ButtonDefaultOpacity from "../../../components/ButtonDefaultOpacity";
import ItemSeparatorComponent from "../../../components/ItemSeparatorComponent";

type NavigationParams = Readonly<{
  bonusItem: BonusAvailable;
}>;

type OwnProps = NavigationInjectedProps<NavigationParams>;

type Props = OwnProps &
  ReturnType<typeof mapDispatchToProps> &
  ReturnType<typeof mapStateToProps>;

const styles = StyleSheet.create({
  noPadded: {
    paddingLeft: 0,
    paddingRight: 0
  },
  mainContent: {
    flex: 1
  },
  flexEnd: {
    alignSelf: "flex-end"
  },
  flexStart: {
    alignSelf: "flex-start"
  },
  cover: {
    resizeMode: "contain",
    width: 48,
    height: 48
  },
  serviceMultiImage: {
    width: 48,
    height: 48
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  orgName: {
    fontSize: 18,
    lineHeight: customVariables.lineHeight2
  },
  title: {
    fontSize: customVariables.fontSize3,
    lineHeight: customVariables.lineHeightH3,
    color: customVariables.colorBlack
  }
});

/**
 * A screen to explain how the bonus activation works and how it will be assigned
 */
const BonusInformationScreen: React.FunctionComponent<Props> = props => {
  const [isMarkdownLoaded, setMarkdownLoaded] = React.useState(false);

  const getBonusItem = () => props.navigation.getParam("bonusItem");

  const bonusItem = getBonusItem();

  const cancelButtonProps = {
    block: true,
    light: true,
    bordered: true,
    onPress: props.navigateBack,
    title: I18n.t("global.buttons.cancel")
  };
  const requestButtonProps = {
    block: true,
    primary: true,
    onPress: props.requestBonusActivation,
    title: I18n.t("global.buttons.saveSelection")
  };

  const ContainerComponent = withLoadingSpinner(() => (
    <BaseScreenComponent goBack={true} headerTitle={bonusItem.name}>
      <Content>
        <View style={styles.row}>
          <View style={styles.flexStart}>
            {props.serviceById &&
              pot.isSome(props.serviceById) && (
                <MultiImage
                  style={styles.serviceMultiImage}
                  source={logosForService(props.serviceById.value)}
                />
              )}
          </View>
          <View style={styles.flexEnd}>
            {bonusItem.cover && (
              <Image source={{ uri: bonusItem.cover }} style={styles.cover} />
            )}
          </View>
        </View>
        <View spacer={true} />
        {props.serviceById &&
          pot.isSome(props.serviceById) && (
            <Text style={styles.orgName}>
              {props.serviceById.value.organization_name}
            </Text>
          )}
        <Text bold={true} style={styles.title}>{`${I18n.t(
          "bonus.requestTitle"
        )} ${bonusItem.name}`}</Text>
        <View spacer={true} large={true} />
        <Text>{bonusItem.description}</Text>
        <ButtonDefaultOpacity
          style={styles.noPadded}
          small={true}
          transparent={true}
        >
          <Text>Privacy policy</Text>
        </ButtonDefaultOpacity>
        <View spacer={true} />
        <ItemSeparatorComponent noPadded={true} />
        <View spacer={true} />
        <Markdown onLoadEnd={() => setMarkdownLoaded(true)}>
          {/* TODO Replace with correct text of bonus */
          I18n.t("profile.main.privacy.exportData.info.body")}
        </Markdown>
        <View spacer={true} extralarge={true} />
        <ItemSeparatorComponent noPadded={true} />
        <View spacer={true} extralarge={true} />
        <Text>
          Cliccando su “Richiedi il Bonus Vacanze” dichiari di avere letto e
          compreso i Termini e le Condizioni d’uso e la Privacy Policy del
          servizio.
        </Text>
        <View spacer={true} extralarge={true} />
        <View spacer={true} extralarge={true} />
        <View spacer={true} large={true} />
      </Content>
      {isMarkdownLoaded && (
        <FooterWithButtons
          type="TwoButtonsInlineThird"
          leftButton={cancelButtonProps}
          rightButton={requestButtonProps}
        />
      )}
    </BaseScreenComponent>
  ));
  return <ContainerComponent isLoading={!isMarkdownLoaded} />;
};

const mapStateToProps = (state: GlobalState, props: OwnProps) => {
  const serviceById = fromNullable(
    props.navigation.getParam("bonusItem").service_id
  ).fold(undefined, s => serviceByIdSelector(s)(state));
  return {
    serviceById
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  // TODO add bonus request action or just navigate to TOS screen (?)
  requestBonusActivation: () => dispatch(navigateToBonusTosScreen()),
  navigateBack: () => dispatch(navigateBack())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BonusInformationScreen);
