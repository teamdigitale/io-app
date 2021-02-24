import { fromNullable, none, Option, some } from "fp-ts/lib/Option";
import { AmountInEuroCents, RptId } from "italia-pagopa-commons/lib/pagopa";
import { ActionSheet, Content, Text, View } from "native-base";
import * as React from "react";
import { Alert, StyleSheet } from "react-native";
import { NavigationInjectedProps } from "react-navigation";
import { connect } from "react-redux";
import { ImportoEuroCents } from "../../../../definitions/backend/ImportoEuroCents";
import { PaymentRequestsGetResponse } from "../../../../definitions/backend/PaymentRequestsGetResponse";
import { ContextualHelp } from "../../../components/ContextualHelp";
import ButtonDefaultOpacity from "../../../components/ButtonDefaultOpacity";
import { withErrorModal } from "../../../components/helpers/withErrorModal";
import { withLightModalContext } from "../../../components/helpers/withLightModalContext";
import { withLoadingSpinner } from "../../../components/helpers/withLoadingSpinner";
import BaseScreenComponent, {
  ContextualHelpPropsMarkdown
} from "../../../components/screens/BaseScreenComponent";
import TouchableDefaultOpacity from "../../../components/TouchableDefaultOpacity";
import IconFont from "../../../components/ui/IconFont";
import { LightModalContextInterface } from "../../../components/ui/LightModal";
import Markdown from "../../../components/ui/Markdown";
import CardComponent from "../../../components/wallet/card/CardComponent";
import PaymentBannerComponent from "../../../components/wallet/PaymentBannerComponent";
import I18n from "../../../i18n";
import {
  navigateToPaymentPickPaymentMethodScreen,
  navigateToPaymentPickPspScreen
} from "../../../store/actions/navigation";
import { Dispatch } from "../../../store/actions/types";
import {
  backToEntrypointPayment,
  paymentExecuteStart,
  paymentInitializeState,
  paymentWebViewEnd,
  PaymentWebViewEndReason,
  runDeleteActivePaymentSaga
} from "../../../store/actions/wallet/payment";
import { GlobalState } from "../../../store/reducers/types";
import variables from "../../../theme/variables";
import customVariables from "../../../theme/variables";
import { Psp, Wallet } from "../../../types/pagopa";
import { showToast } from "../../../utils/showToast";
import { getLocalePrimaryWithFallback } from "../../../utils/locale";
import { PayloadForAction } from "../../../types/utils";
import {
  paymentStartPayloadSelector,
  PaymentStartWebViewPayload,
  pmSessionTokenSelector
} from "../../../store/reducers/wallet/payment";
import {
  isError,
  isLoading,
  isReady
} from "../../../features/bonus/bpd/model/RemoteValue";
import { PayWebViewModal } from "../../../components/wallet/PayWebViewModal";
import { formatNumberCentsToAmount } from "../../../utils/stringBuilder";
import { pagoPaApiUrlPrefix, pagoPaApiUrlPrefixTest } from "../../../config";
import { H4 } from "../../../components/core/typography/H4";
import { isPagoPATestEnabledSelector } from "../../../store/reducers/persistedPreferences";

export type NavigationParams = Readonly<{
  rptId: RptId;
  initialAmount: AmountInEuroCents;
  verifica: PaymentRequestsGetResponse;
  idPayment: string;
  wallet: Wallet;
  psps: ReadonlyArray<Psp>;
}>;

type OwnProps = NavigationInjectedProps<NavigationParams>;

type Props = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> &
  LightModalContextInterface &
  OwnProps;

const styles = StyleSheet.create({
  child: {
    flex: 1,
    alignContent: "center"
  },
  childTwice: {
    flex: 2,
    alignContent: "center"
  },
  parent: {
    flexDirection: "row"
  },
  paddedLR: {
    paddingLeft: variables.contentPadding,
    paddingRight: variables.contentPadding
  },
  textRight: {
    textAlign: "right"
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: variables.brandGray
  },
  textCenter: {
    textAlign: "center"
  },
  padded: { paddingHorizontal: customVariables.contentPadding },
  alert: {
    backgroundColor: customVariables.brandHighLighter,
    paddingHorizontal: customVariables.contentPadding,
    paddingVertical: 11,
    flexDirection: "row"
  },
  alertIcon: {
    alignSelf: "center",
    paddingRight: 18
  },
  flex: { flex: 1 },
  textColor: { color: customVariables.brandDarkGray }
});

const contextualHelpMarkdown: ContextualHelpPropsMarkdown = {
  title: "wallet.whyAFee.title",
  body: "wallet.whyAFee.text"
};

const payUrlSuffix = "/v3/webview/transactions/pay";
const webViewExitPathName = "/v3/webview/logout/bye";
const webViewOutcomeParamName = "outcome";

const ConfirmPaymentMethodScreen: React.FC<Props> = (props: Props) => {
  const showHelp = () => {
    props.showModal(
      <ContextualHelp
        onClose={props.hideModal}
        title={I18n.t("wallet.whyAFee.title")}
        body={() => <Markdown>{I18n.t("wallet.whyAFee.text")}</Markdown>}
      />
    );
  };
  const urlPrefix = props.isPagoPATestEnabled
    ? pagoPaApiUrlPrefixTest
    : pagoPaApiUrlPrefix;

  const verifica: PaymentRequestsGetResponse = props.navigation.getParam(
    "verifica"
  );
  const wallet: Wallet = props.navigation.getParam("wallet");
  const idPayment: string = props.navigation.getParam("idPayment");
  const paymentReason = verifica.causaleVersamento;
  const maybePsp = fromNullable(wallet.psp);
  const fee = maybePsp.fold(undefined, psp => psp.fixedCost.amount);

  const totalAmount = maybePsp.fold(
    verifica.importoSingoloVersamento,
    fee =>
      (verifica.importoSingoloVersamento as number) +
      (fee.fixedCost.amount as number)
  );

  // the user press back during the pay web view challenge
  const handlePayWebviewGoBack = () => {
    Alert.alert(I18n.t("payment.abortWebView.title"), "", [
      {
        text: I18n.t("payment.abortWebView.confirm"),
        onPress: () => {
          props.dispatchCancelPayment();
          props.dispatchEndPaymentWebview("ABORT_BY_THE_USER");
        },
        style: "cancel"
      },
      {
        text: I18n.t("payment.abortWebView.cancel")
      }
    ]);
  };

  return (
    <BaseScreenComponent
      goBack={props.onCancel}
      headerTitle={I18n.t("wallet.ConfirmPayment.header")}
      contextualHelpMarkdown={contextualHelpMarkdown}
      faqCategories={["payment"]}
    >
      <Content noPadded={true} bounces={false}>
        <PaymentBannerComponent
          currentAmount={verifica.importoSingoloVersamento}
          paymentReason={paymentReason}
          fee={fee as ImportoEuroCents}
        />
        <View style={styles.padded}>
          <View spacer={true} />
          <CardComponent
            type={"Full"}
            wallet={wallet}
            hideMenu={true}
            hideFavoriteIcon={true}
          />
          <View spacer={true} />
          {maybePsp.isNone() ? (
            <H4 weight={"Regular"}>{I18n.t("payment.noPsp")}</H4>
          ) : (
            <H4 weight={"Regular"}>
              {I18n.t("payment.currentPsp")}
              <H4>{` ${maybePsp.value.businessName}`}</H4>
            </H4>
          )}
          <TouchableDefaultOpacity onPress={props.pickPsp}>
            <Text link={true} bold={true}>
              {I18n.t("payment.changePsp")}
            </Text>
          </TouchableDefaultOpacity>
          <View spacer={true} large={true} />
          <TouchableDefaultOpacity testID="why-a-fee" onPress={showHelp}>
            <Text link={true}>{I18n.t("wallet.whyAFee.title")}</Text>
          </TouchableDefaultOpacity>
        </View>
      </Content>

      <View style={styles.alert}>
        <IconFont
          style={styles.alertIcon}
          name={"io-notice"}
          size={24}
          color={customVariables.brandDarkGray}
        />
        <Text style={[styles.flex, styles.textColor]}>
          <Text bold={true}>{I18n.t("global.genericAlert")}</Text>
          {` ${I18n.t("wallet.ConfirmPayment.info")}`}
        </Text>
      </View>

      <View footer={true}>
        <ButtonDefaultOpacity
          block={true}
          primary={true}
          onPress={() =>
            props.dispatchPaymentStart({
              idWallet: wallet.idWallet,
              idPayment,
              language: getLocalePrimaryWithFallback()
            })
          }
        >
          <Text>{`${I18n.t(
            "wallet.ConfirmPayment.goToPay"
          )} ${formatNumberCentsToAmount(totalAmount, true)}`}</Text>
        </ButtonDefaultOpacity>
        <View spacer={true} />
        <View style={styles.parent}>
          <ButtonDefaultOpacity
            style={styles.child}
            block={true}
            cancel={true}
            onPress={props.onCancel}
          >
            <Text>{I18n.t("global.buttons.cancel")}</Text>
          </ButtonDefaultOpacity>
          <View hspacer={true} />
          <ButtonDefaultOpacity
            style={styles.childTwice}
            block={true}
            bordered={true}
            onPress={props.pickPaymentMethod}
          >
            <Text>{I18n.t("wallet.ConfirmPayment.change")}</Text>
          </ButtonDefaultOpacity>
        </View>
      </View>
      {props.payStartWebviewPayload.isSome() && (
        <PayWebViewModal
          postUri={urlPrefix + payUrlSuffix}
          formData={props.payStartWebviewPayload.value}
          finishPathName={webViewExitPathName}
          onFinish={maybeCode => {
            // TODO display the outcome screen
            Alert.alert(maybeCode.toString());
            props.dispatchEndPaymentWebview("EXIT_FROM_WEB_VIEW");
          }}
          outcomeQueryparamName={webViewOutcomeParamName}
          onGoBack={handlePayWebviewGoBack}
        />
      )}
    </BaseScreenComponent>
  );
};

const mapStateToProps = (state: GlobalState) => {
  const pmSessionToken = pmSessionTokenSelector(state);
  const paymentStartPayload = paymentStartPayloadSelector(state);
  const payStartWebviewPayload: Option<PaymentStartWebViewPayload> =
    isReady(pmSessionToken) && paymentStartPayload
      ? some({ ...paymentStartPayload, sessionToken: pmSessionToken.value })
      : none;
  return {
    isPagoPATestEnabled: isPagoPATestEnabledSelector(state),
    payStartWebviewPayload,
    isLoading: isLoading(pmSessionToken),
    // TODO handle the error considering the failure coming from pm session token refresh and webview outcome
    error: isError(pmSessionToken) ? some(pmSessionToken.error.message) : none
  };
};

const mapDispatchToProps = (dispatch: Dispatch, props: OwnProps) => {
  const dispatchCancelPayment = () => {
    // on cancel:
    // navigate to entrypoint of payment or wallet home
    dispatch(backToEntrypointPayment());
    // delete the active payment from pagoPA
    dispatch(runDeleteActivePaymentSaga());
    // reset the payment state
    dispatch(paymentInitializeState());
    showToast(I18n.t("wallet.ConfirmPayment.cancelPaymentSuccess"), "success");
  };
  return {
    pickPaymentMethod: () =>
      dispatch(
        navigateToPaymentPickPaymentMethodScreen({
          rptId: props.navigation.getParam("rptId"),
          initialAmount: props.navigation.getParam("initialAmount"),
          verifica: props.navigation.getParam("verifica"),
          idPayment: props.navigation.getParam("idPayment")
        })
      ),
    pickPsp: () =>
      dispatch(
        navigateToPaymentPickPspScreen({
          rptId: props.navigation.getParam("rptId"),
          initialAmount: props.navigation.getParam("initialAmount"),
          verifica: props.navigation.getParam("verifica"),
          idPayment: props.navigation.getParam("idPayment"),
          psps: props.navigation.getParam("psps"),
          wallet: props.navigation.getParam("wallet"),
          chooseToChange: true
        })
      ),
    onCancel: () => {
      ActionSheet.show(
        {
          options: [
            I18n.t("wallet.ConfirmPayment.confirmCancelPayment"),
            I18n.t("wallet.ConfirmPayment.confirmContinuePayment")
          ],
          destructiveButtonIndex: 0,
          cancelButtonIndex: 1,
          title: I18n.t("wallet.ConfirmPayment.confirmCancelTitle")
        },
        buttonIndex => {
          if (buttonIndex === 0) {
            dispatchCancelPayment();
          }
        }
      );
    },
    dispatchPaymentStart: (
      payload: PayloadForAction<typeof paymentExecuteStart["request"]>
    ) => dispatch(paymentExecuteStart.request(payload)),
    dispatchEndPaymentWebview: (reason: PaymentWebViewEndReason) => {
      dispatch(paymentWebViewEnd(reason));
    },
    dispatchCancelPayment
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(
  withLightModalContext(
    withErrorModal(
      withLoadingSpinner(ConfirmPaymentMethodScreen),
      (_: string) => _
    )
  )
);
