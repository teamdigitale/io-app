import * as React from "react";
import { useEffect } from "react";
import { View } from "native-base";
import { connect } from "react-redux";
import {
  FlatList,
  Image,
  ListRenderItemInfo,
  SafeAreaView,
  ScrollView
} from "react-native";
import { NavigationInjectedProps } from "react-navigation";
import { fromNullable } from "fp-ts/lib/Option";
import { GlobalState } from "../../../../../store/reducers/types";
import { Dispatch } from "../../../../../store/actions/types";
import BaseScreenComponent from "../../../../../components/screens/BaseScreenComponent";
import { IOStyles } from "../../../../../components/core/variables/IOStyles";
import { emptyContextualHelp } from "../../../../../utils/emptyContextualHelp";
import FooterWithButtons from "../../../../../components/ui/FooterWithButtons";
import { confirmButtonProps } from "../../../bonusVacanze/components/buttons/ButtonConfigurations";
import { openWebUrl } from "../../../../../utils/url";
import { H1 } from "../../../../../components/core/typography/H1";
import { H4 } from "../../../../../components/core/typography/H4";
import { H2 } from "../../../../../components/core/typography/H2";
import I18n from "../../../../../i18n";
import CgnMerchantDiscountItem from "../../components/merchants/CgnMerchantsDiscountItem";
import { Merchant } from "../../../../../../definitions/cgn/merchants/Merchant";
import { cgnSelectedMerchantSelector } from "../../store/reducers/merchants";
import { Discount } from "../../../../../../definitions/cgn/merchants/Discount";
import { cgnSelectedMerchant } from "../../store/actions/merchants";
import { LoadingErrorComponent } from "../../../bonusVacanze/components/loadingErrorScreen/LoadingErrorComponent";
import { isLoading, isReady } from "../../../bpd/model/RemoteValue";

type NavigationParams = Readonly<{
  merchantID: Merchant["id"];
}>;

type Props = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> &
  NavigationInjectedProps<NavigationParams>;

const CgnMerchantDetailScreen: React.FunctionComponent<Props> = (
  props: Props
) => {
  const { merchantDetail } = props;
  const renderDiscountListItem = ({ item }: ListRenderItemInfo<Discount>) => (
    <CgnMerchantDiscountItem discount={item} />
  );

  const loadMerchantDetail = () => {
    props.requestMerchantDetail(props.navigation.getParam("merchantID"));
  };

  useEffect(loadMerchantDetail, []);

  return isReady(merchantDetail) ? (
    <BaseScreenComponent
      goBack={true}
      headerTitle={merchantDetail.value.name}
      contextualHelp={emptyContextualHelp}
    >
      <SafeAreaView style={IOStyles.flex}>
        <ScrollView style={[IOStyles.flex]} bounces={false}>
          {merchantDetail.value.imageUrl && (
            <View style={{ paddingHorizontal: 16 }}>
              <Image
                source={{ uri: merchantDetail.value.imageUrl }}
                style={{
                  width: "100%",
                  height: 230,
                  resizeMode: "cover",
                  borderRadius: 12
                }}
              />
            </View>
          )}
          <View style={IOStyles.horizontalContentPadding}>
            <View spacer large />
            <H1>{merchantDetail.value.name}</H1>
            <H4 weight={"Regular"}>
              {fromNullable(merchantDetail.value.addresses).fold(
                merchantDetail.value.websiteUrl,
                addresses => addresses[0].full_address
              )}
            </H4>
            <View spacer />
            <H2>{I18n.t("bonus.cgn.merchantDetail.title.deals")}</H2>
            <View spacer small />
            <FlatList
              data={merchantDetail.value.discounts}
              renderItem={renderDiscountListItem}
            />
            <H2>{I18n.t("bonus.cgn.merchantDetail.title.description")}</H2>
            <H4 weight={"Regular"}>{merchantDetail.value.description}</H4>
            <View spacer large />
          </View>
        </ScrollView>
        {fromNullable(merchantDetail.value.websiteUrl).fold(<></>, url => (
          // eslint-disable-next-line react/jsx-key
          <FooterWithButtons
            type={"SingleButton"}
            leftButton={confirmButtonProps(
              () => openWebUrl(url),
              I18n.t("bonus.cgn.merchantDetail.cta.label")
            )}
          />
        ))}
      </SafeAreaView>
    </BaseScreenComponent>
  ) : (
    <LoadingErrorComponent
      isLoading={isLoading(merchantDetail)}
      loadingCaption={I18n.t("global.remoteStates.loading")}
      onRetry={loadMerchantDetail}
    />
  );
};

const mapStateToProps = (state: GlobalState) => ({
  merchantDetail: cgnSelectedMerchantSelector(state)
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  requestMerchantDetail: (id: Merchant["id"]) =>
    dispatch(cgnSelectedMerchant.request(id))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CgnMerchantDetailScreen);
