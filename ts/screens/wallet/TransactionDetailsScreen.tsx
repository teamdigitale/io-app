import { fromNullable } from "fp-ts/lib/Option";
import * as pot from "italia-ts-commons/lib/pot";
import { Text, View } from "native-base";
import * as React from "react";
import {
  BackHandler,
  Image,
  StyleSheet,
  TouchableWithoutFeedback
} from "react-native";
import { NavigationEvents, NavigationInjectedProps } from "react-navigation";
import { connect } from "react-redux";
import ButtonDefaultOpacity from "../../components/ButtonDefaultOpacity";
import CopyButtonComponent from "../../components/CopyButtonComponent";
import { withLightModalContext } from "../../components/helpers/withLightModalContext";
import { withLoadingSpinner } from "../../components/helpers/withLoadingSpinner";
import ItemSeparatorComponent from "../../components/ItemSeparatorComponent";
import BaseScreenComponent, {
  ContextualHelpPropsMarkdown
} from "../../components/screens/BaseScreenComponent";
import { LightModalContextInterface } from "../../components/ui/LightModal";
import { PaymentSummaryComponent } from "../../components/wallet/PaymentSummaryComponent";
import { SlidedContentComponent } from "../../components/wallet/SlidedContentComponent";
import I18n from "../../i18n";
import { Dispatch } from "../../store/actions/types";
import { backToEntrypointPayment } from "../../store/actions/wallet/payment";
import { fetchPsp } from "../../store/actions/wallet/transactions";
import { navHistorySelector } from "../../store/reducers/navigationHistory";
import { GlobalState } from "../../store/reducers/types";
import { pspStateByIdSelector } from "../../store/reducers/wallet/pspsById";
import { getWalletsById } from "../../store/reducers/wallet/wallets";
import customVariables from "../../theme/variables";
import { Transaction } from "../../types/pagopa";
import { clipboardSetStringWithFeedback } from "../../utils/clipboard";
import { formatDateAsLocal } from "../../utils/dates";
import { whereAmIFrom } from "../../utils/navigation";
import {
  cleanTransactionDescription,
  getTransactionFee,
  getTransactionIUV
} from "../../utils/payment";
import { formatNumberCentsToAmount } from "../../utils/stringBuilder";

type NavigationParams = Readonly<{
  isPaymentCompletedTransaction: boolean;
  transaction: Transaction;
}>;

type OwnProps = NavigationInjectedProps<NavigationParams>;

type Props = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> &
  LightModalContextInterface &
  OwnProps;

/**
 * isTransactionStarted will be true when the user accepted to proceed with a transaction
 * and he is going to display the detail of the transaction as receipt
 */

const styles = StyleSheet.create({
  pspLogo: {
    maxWidth: 80,
    maxHeight: 32,
    width: "100%",
    height: "100%",
    resizeMode: "contain"
  },
  cardLogo: {
    alignSelf: "flex-end",
    height: 30,
    width: 48
  },
  darkText: {
    color: customVariables.brandDarkestGray
  },
  bigText: {
    fontSize: 20
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  cardIcon: {
    alignSelf: "flex-end",
    height: 30,
    width: 48
  },
  centered: { alignItems: "center" },
  flex: {
    flex: 1,
    alignSelf: "center"
  }
});

const contextualHelpMarkdown: ContextualHelpPropsMarkdown = {
  title: "wallet.transactionDetails",
  body: "wallet.detailsTransaction.contextualHelpContent"
};

type State = {
  showFullReason: boolean;
};

/**
 * Transaction details screen, displaying
 * a list of information available about a
 * specific transaction.
 */
class TransactionDetailsScreen extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { showFullReason: false };
  }

  public componentDidMount() {
    BackHandler.addEventListener("hardwareBackPress", this.handleBackPress);
  }

  public componentWillUnmount() {
    BackHandler.removeEventListener("hardwareBackPress", this.handleBackPress);
  }

  private handleBackPress = () => {
    if (
      whereAmIFrom(this.props.nav).fold(
        false,
        r => r === "WALLET_HOME" || r === "WALLET_PAYMENT_METHOD_DETAIL"
      )
    ) {
      return this.props.navigation.goBack();
    } else {
      this.props.navigateBackToEntrypointPayment();
      return true;
    }
  };

  private handleWillFocus = () => {
    const transaction = this.props.navigation.getParam("transaction");
    // Fetch psp only if the store not contains this psp
    if (transaction.idPsp !== undefined && this.props.psp === undefined) {
      this.props.fetchPsp(transaction.idPsp);
    }
  };

  private getData = () => {
    const transaction = this.props.navigation.getParam("transaction");
    const amount = formatNumberCentsToAmount(transaction.amount.amount, true);

    // fee
    const fee = getTransactionFee(transaction);

    const totalAmount = formatNumberCentsToAmount(
      transaction.grandTotal.amount,
      true
    );

    const transactionWallet = this.props.wallets
      ? this.props.wallets[transaction.idWallet]
      : undefined;

    const transactionDateTime = formatDateAsLocal(transaction.created, true)
      .concat(" - ")
      .concat(transaction.created.toLocaleTimeString());

    const paymentMethodIcon = fromNullable(
      transactionWallet &&
        transactionWallet.creditCard &&
        transactionWallet.creditCard.brandLogo
    )
      .map(logo => (logo.trim().length > 0 ? logo.trim() : undefined))
      .getOrElse(undefined);

    const paymentMethodBrand =
      transactionWallet &&
      transactionWallet.creditCard &&
      transactionWallet.creditCard.brand;

    const iuv = getTransactionIUV(transaction.description).toUndefined();

    const idTransaction = transaction.id;
    return {
      fullReason: transaction.description,
      iuv,
      idTransaction,
      paymentMethodBrand,
      paymentMethodIcon,
      transactionDateTime,
      amount,
      totalAmount,
      fee
    };
  };

  private handleOnFullReasonPress = () =>
    this.setState(ps => ({ showFullReason: !ps.showFullReason }));

  public render(): React.ReactNode {
    const { psp } = this.props;
    const transaction = this.props.navigation.getParam("transaction");
    const data = this.getData();

    const standardRow = (label: string, value: string) => (
      <View style={styles.row}>
        <Text style={styles.flex}>{label}</Text>
        <Text bold={true} dark={true} selectable={true}>
          {value}
        </Text>
      </View>
    );

    return (
      <BaseScreenComponent
        dark={true}
        contextualHelpMarkdown={contextualHelpMarkdown}
        goBack={this.handleBackPress}
        headerTitle={I18n.t("wallet.transactionDetails")}
        faqCategories={["wallet_transaction"]}
      >
        <NavigationEvents onWillFocus={this.handleWillFocus} />
        <SlidedContentComponent hasFlatBottom={true}>
          <PaymentSummaryComponent
            title={I18n.t("wallet.receipt")}
            recipient={transaction.merchant}
            description={cleanTransactionDescription(transaction.description)}
          />
          <TouchableWithoutFeedback onPress={this.handleOnFullReasonPress}>
            <Text link={true}>{I18n.t("wallet.transactionFullReason")}</Text>
          </TouchableWithoutFeedback>
          {this.state.showFullReason && (
            <Text
              selectable={true}
              onLongPress={() =>
                clipboardSetStringWithFeedback(data.fullReason)
              }
            >
              {data.fullReason}
            </Text>
          )}
          <View spacer={true} large={true} />
          {data.iuv && standardRow(I18n.t("payment.IUV"), data.iuv)}
          {/** transaction date */}
          <View spacer={true} xsmall={true} />
          <View spacer={true} large={true} />
          {standardRow(
            I18n.t("wallet.firstTransactionSummary.date"),
            data.transactionDateTime
          )}

          <View spacer={true} large={true} />
          <ItemSeparatorComponent noPadded={true} />
          <View spacer={true} large={true} />

          {standardRow(
            I18n.t("wallet.firstTransactionSummary.amount"),
            data.amount
          )}

          {data.fee && (
            <>
              <View spacer={true} small={true} />
              {standardRow(
                I18n.t("wallet.firstTransactionSummary.fee"),
                data.fee
              )}
            </>
          )}

          <View spacer={true} />

          {/** Total amount (amount + fee) */}
          <View style={styles.row}>
            <Text style={[styles.bigText, styles.flex]} bold={true} dark={true}>
              {I18n.t("wallet.firstTransactionSummary.total")}
            </Text>
            <Text style={styles.bigText} bold={true} dark={true}>
              {data.totalAmount}
            </Text>
          </View>

          {(data.paymentMethodIcon || (psp && psp.logoPSP)) && (
            <React.Fragment>
              <View spacer={true} large={true} />
              <ItemSeparatorComponent noPadded={true} />
              <View spacer={true} large={true} />
            </React.Fragment>
          )}

          {/** paymnet method icon */}
          {/** to be implemented with the card logo when https://github.com/pagopa/io-app/pull/1622/ is merged */}

          {data.paymentMethodIcon ? (
            <View
              style={[styles.row, styles.centered]}
              accessible
              accessibilityLabel={
                data.paymentMethodBrand
                  ? `${I18n.t("wallet.paymentMethod")}, ${
                      data.paymentMethodBrand
                    }`
                  : undefined
              }
            >
              <Text>{I18n.t("wallet.paymentMethod")}</Text>
              <Image
                style={styles.cardLogo}
                source={{ uri: data.paymentMethodIcon }}
              />
            </View>
          ) : (
            data.paymentMethodBrand && (
              <Text bold={true}>{data.paymentMethodBrand}</Text>
            )
          )}

          {(data.paymentMethodIcon || data.paymentMethodBrand) && (
            <View spacer={true} />
          )}

          {/** Transaction id */}
          <View>
            <Text>
              {I18n.t("wallet.firstTransactionSummary.idTransaction")}
            </Text>
            <View style={styles.row}>
              <Text bold={true}>{data.idTransaction}</Text>
              <CopyButtonComponent textToCopy={data.idTransaction.toString()} />
            </View>
          </View>

          <View spacer={true} large={true} />
          <View spacer={true} large={true} />
          <ButtonDefaultOpacity
            light={true}
            bordered={true}
            block={true}
            onPress={this.handleBackPress}
          >
            <Text>{I18n.t("global.buttons.close")}</Text>
          </ButtonDefaultOpacity>
          <View spacer={true} />
        </SlidedContentComponent>
      </BaseScreenComponent>
    );
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  navigateBackToEntrypointPayment: () => dispatch(backToEntrypointPayment()),
  fetchPsp: (idPsp: number) => dispatch(fetchPsp.request({ idPsp }))
});

const mapStateToProps = (state: GlobalState, ownProps: OwnProps) => {
  const transaction = ownProps.navigation.getParam("transaction");
  const idPsp = String(transaction.idPsp);

  const maybePotPspState = fromNullable(pspStateByIdSelector(idPsp)(state));
  const potPsp = maybePotPspState.map(_ => _.psp).getOrElse(pot.none);
  const isLoading = pot.isLoading(potPsp);

  return {
    wallets: pot.toUndefined(getWalletsById(state)),
    isLoading,
    psp: pot.toUndefined(potPsp),
    nav: navHistorySelector(state)
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withLightModalContext(withLoadingSpinner(TransactionDetailsScreen)));
