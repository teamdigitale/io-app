import * as React from "react";
import { useContext, useState } from "react";
import { connect } from "react-redux";
import { Platform, SafeAreaView, StyleSheet } from "react-native";
import { Tab, Tabs, View } from "native-base";
import { constNull } from "fp-ts/lib/function";
import { GlobalState } from "../../../../../store/reducers/types";
import { Dispatch } from "../../../../../store/actions/types";
import BaseScreenComponent from "../../../../../components/screens/BaseScreenComponent";
import { IOStyles } from "../../../../../components/core/variables/IOStyles";
import I18n from "../../../../../i18n";
import { emptyContextualHelp } from "../../../../../utils/emptyContextualHelp";
import { navigateToCgnMerchantDetail } from "../../navigation/actions";
import customVariables from "../../../../../theme/variables";
import { makeFontStyleObject } from "../../../../../components/core/fonts";
import CgnMerchantsListView from "../../components/merchants/CgnMerchantsListView";
import { H1 } from "../../../../../components/core/typography/H1";
import {
  BottomTopAnimation,
  LightModalContext
} from "../../../../../components/ui/LightModal";
import CgnMerchantsFilters from "../../components/merchants/CgnMerchantsFilters";
import FooterWithButtons from "../../../../../components/ui/FooterWithButtons";
import { confirmButtonProps } from "../../../bonusVacanze/components/buttons/ButtonConfigurations";
import { Merchant } from "../../../../../../definitions/cgn/merchants/Merchant";

type Props = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>;

const styles = StyleSheet.create({
  tabBarContainer: {
    elevation: 0,
    height: 40
  },
  tabBarUnderline: {
    borderBottomColor: customVariables.tabUnderlineColor,
    borderBottomWidth: customVariables.tabUnderlineHeight
  },
  tabBarUnderlineActive: {
    height: customVariables.tabUnderlineHeight,
    // borders do not overlap each other, but stack naturally
    marginBottom: -customVariables.tabUnderlineHeight,
    backgroundColor: customVariables.contentPrimaryBackground
  },
  activeTextStyle: {
    ...makeFontStyleObject("SemiBold"),
    fontSize: Platform.OS === "android" ? 16 : undefined,
    fontWeight: Platform.OS === "android" ? "normal" : "bold",
    color: customVariables.brandPrimary
  },
  textStyle: {
    color: customVariables.brandDarkGray
  }
});

/**
 * Screen that renders the list of the merchants which have an active discount for CGN
 * @param props
 * @constructor
 */
const CgnMerchantsTabsScreen: React.FunctionComponent<Props> = (
  props: Props
) => {
  const { showAnimatedModal, hideModal } = useContext(LightModalContext);
  const [selectedTab, setSelectedTab] = useState<"online" | "places">("online");

  const onItemPress = () => {
    // TODO Add the dispatch of merchant selected when the complete workflow is available
    props.navigateToMerchantDetail();
  };

  const openFiltersModal = () =>
    showAnimatedModal(
      // TODO replace onConfirm function when the search functionalities are defined
      <CgnMerchantsFilters
        onClose={hideModal}
        onConfirm={constNull}
        isLocal={selectedTab === "places"}
      />,
      BottomTopAnimation
    );

  return (
    <BaseScreenComponent
      goBack
      headerTitle={I18n.t("bonus.cgn.merchantsList.navigationTitle")}
      contextualHelp={emptyContextualHelp}
      isSearchAvailable={{ enabled: true, onSearchTap: openFiltersModal }}
    >
      <SafeAreaView style={IOStyles.flex}>
        <Tabs
          tabContainerStyle={[styles.tabBarContainer, styles.tabBarUnderline]}
          tabBarUnderlineStyle={styles.tabBarUnderlineActive}
          onChangeTab={(e: any) => {
            setSelectedTab(e.i === 1 ? "places" : "online");
          }}
          initialPage={0}
        >
          <Tab
            activeTextStyle={styles.activeTextStyle}
            textStyle={styles.textStyle}
            heading={I18n.t("bonus.cgn.merchantsList.online")}
          >
            <CgnMerchantsListView
              merchantList={props.merchants}
              onItemPress={onItemPress}
            />
          </Tab>
          <Tab
            activeTextStyle={styles.activeTextStyle}
            textStyle={styles.textStyle}
            heading={I18n.t("bonus.cgn.merchantsList.places")}
          >
            <View style={[IOStyles.horizontalContentPadding, IOStyles.flex]}>
              {/* TODO PLACEHOLDER HERE GOES THE MAP */}
              <H1>{`${I18n.t("bonus.cgn.merchantsList.places")} TAB`}</H1>
            </View>
          </Tab>
        </Tabs>
        <FooterWithButtons
          type={"SingleButton"}
          leftButton={confirmButtonProps(
            openFiltersModal,
            I18n.t("bonus.cgn.merchantsList.cta.filter")
          )}
        />
      </SafeAreaView>
    </BaseScreenComponent>
  );
};

const mapStateToProps = (_: GlobalState) => ({
  // FIXME replace with selector when available
  merchants: []
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  navigateToMerchantDetail: () =>
    dispatch(
      navigateToCgnMerchantDetail({ merchantID: "some" as Merchant["id"] })
    )
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CgnMerchantsTabsScreen);
