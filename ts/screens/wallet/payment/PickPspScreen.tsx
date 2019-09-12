import { AmountInEuroCents, RptId } from "italia-pagopa-commons/lib/pagopa";
import * as pot from "italia-ts-commons/lib/pot";
import { Content, H1, Text, View } from "native-base";
import * as React from "react";
import { FlatList, Image, StyleSheet } from "react-native";
import { Col, Grid, Row } from "react-native-easy-grid";
import { NavigationInjectedProps } from "react-navigation";
import { connect } from "react-redux";

import { PaymentRequestsGetResponse } from "../../../../definitions/backend/PaymentRequestsGetResponse";
import { withLoadingSpinner } from "../../../components/helpers/withLoadingSpinner";
import BaseScreenComponent from "../../../components/screens/BaseScreenComponent";
import TouchableWithoutOpacity from "../../../components/TouchableWithoutOpacity";
import IconFont from "../../../components/ui/IconFont";
import I18n from "../../../i18n";
import { Dispatch } from "../../../store/actions/types";
import { GlobalState } from "../../../store/reducers/types";
import variables from "../../../theme/variables";
import { Psp, Wallet } from "../../../types/pagopa";
import { showToast } from "../../../utils/showToast";
import {
  centsToAmount,
  formatNumberAmount
} from "../../../utils/stringBuilder";
import { dispatchUpdatePspForWalletAndConfirm } from "./common";

type NavigationParams = Readonly<{
  rptId: RptId;
  initialAmount: AmountInEuroCents;
  verifica: PaymentRequestsGetResponse;
  idPayment: string;
  psps: ReadonlyArray<Psp>;
  wallet: Wallet;
}>;

type OwnProps = NavigationInjectedProps<NavigationParams>;

type Props = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> &
  OwnProps;

const styles = StyleSheet.create({
  contentContainerStyle: {
    flex: 1,
    padding: variables.contentPadding
  },

  listItem: {
    marginLeft: 0,
    flex: 1,
    paddingRight: 0
  },

  icon: {
    flexDirection: "row",
    alignItems: "center"
  },

  feeText: {
    color: variables.brandDarkGray,
    fontSize: variables.fontSizeSmall
  },

  flexStart: {
    flexDirection: "row",
    justifyContent: "flex-start",
    width: 100,
    height: 50
  },

  bottomBorder: {
    borderBottomWidth: 1,
    borderBottomColor: variables.brandGray
  },

  linkStyle: {
    color: variables.brandPrimary,
    fontWeight: "bold"
  }
});

/**
 * Select a PSP to be used for a the current selected wallet
 */
class PickPspScreen extends React.Component<Props> {
  public render(): React.ReactNode {
    const availablePsps = this.props.navigation.getParam("psps");

    return (
      <BaseScreenComponent
        goBack={true}
        headerTitle={I18n.t("saveCard.saveCard")}
      >
        <Content
          contentContainerStyle={styles.contentContainerStyle}
          noPadded={true}
        >
          <H1>{I18n.t("wallet.pickPsp.title")}</H1>
          <View spacer={true} />
          <Text>
            {`${I18n.t("wallet.pickPsp.info")} `}
            <Text bold={true}>{`${I18n.t("wallet.pickPsp.infoBold")} `}</Text>
            <Text>{`${I18n.t("wallet.pickPsp.info2")} `}</Text>
            <TouchableWithoutOpacity>
              <Text style={styles.linkStyle}>
                {I18n.t("wallet.pickPsp.link")}
              </Text>
            </TouchableWithoutOpacity>
          </Text>
          <View spacer={true} />
          <FlatList
            ItemSeparatorComponent={() => <View style={styles.bottomBorder} />}
            removeClippedSubviews={false}
            numColumns={1}
            data={availablePsps}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableWithoutOpacity
                onPress={() => this.props.pickPsp(item.id)}
              >
                <View style={styles.listItem}>
                  <Grid>
                    <Col size={6}>
                      <View spacer={true} />
                      <Row>
                        <Image
                          style={styles.flexStart}
                          resizeMode={"contain"}
                          source={{ uri: item.logoPSP }}
                        />
                      </Row>
                      <Row>
                        <Text style={styles.feeText}>
                          {`${I18n.t("wallet.pickPsp.maxFee")} `}
                          <Text bold={true} style={styles.feeText}>
                            {formatNumberAmount(
                              centsToAmount(item.fixedCost.amount)
                            )}
                          </Text>
                        </Text>
                      </Row>
                      <View spacer={true} />
                    </Col>
                    <Col size={1} style={styles.icon}>
                      <IconFont name="io-right" />
                    </Col>
                  </Grid>
                </View>
              </TouchableWithoutOpacity>
            )}
          />
        </Content>
      </BaseScreenComponent>
    );
  }
}

const mapStateToProps = (state: GlobalState) => ({
  isLoading: pot.isLoading(state.wallet.wallets.walletById)
});

const mapDispatchToProps = (dispatch: Dispatch, props: OwnProps) => {
  return {
    pickPsp: (idPsp: number) =>
      dispatchUpdatePspForWalletAndConfirm(dispatch)(
        idPsp,
        props.navigation.getParam("wallet"),
        props.navigation.getParam("rptId"),
        props.navigation.getParam("initialAmount"),
        props.navigation.getParam("verifica"),
        props.navigation.getParam("idPayment"),
        props.navigation.getParam("psps"),
        () =>
          showToast(I18n.t("wallet.pickPsp.onUpdateWalletPspFailure"), "danger")
      ),
    onCancel: () => props.navigation.goBack()
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withLoadingSpinner(PickPspScreen));
