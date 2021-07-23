/**
 * This screen allows the user to manually insert the data which identify the transaction:
 * - Numero Avviso, which includes: aux, digit, application code, codice IUV
 * - Codice Fiscale Ente CReditore (corresponding to codiceIdentificativoEnte)
 * - amount of the transaction
 *  TODO:
 *  - integrate contextual help to obtain details on the data to insert for manually identifying the transaction
 *    https://www.pivotaltracker.com/n/projects/2048617/stories/157874540
 */

import { Content, Form, H1, Input, Item, Label, Text } from "native-base";
import * as React from "react";
import { Keyboard, ScrollView, StyleSheet } from "react-native";
import { NavigationEvents, NavigationInjectedProps } from "react-navigation";
import { connect } from "react-redux";

import { isLeft, isRight } from "fp-ts/lib/Either";
import { fromEither, none, Option, some } from "fp-ts/lib/Option";
import {
  AmountInEuroCents,
  PaymentNoticeNumberFromString,
  RptId
} from "italia-pagopa-commons/lib/pagopa";
import {
  NonEmptyString,
  OrganizationFiscalCode
} from "italia-ts-commons/lib/strings";
import { withLightModalContext } from "../../../components/helpers/withLightModalContext";

import BaseScreenComponent, {
  ContextualHelpPropsMarkdown
} from "../../../components/screens/BaseScreenComponent";
import TouchableDefaultOpacity from "../../../components/TouchableDefaultOpacity";
import FooterWithButtons from "../../../components/ui/FooterWithButtons";
import { LightModalContextInterface } from "../../../components/ui/LightModal";
import I18n from "../../../i18n";
import {
  navigateBack,
  navigateToPaymentTransactionSummaryScreen
} from "../../../store/actions/navigation";
import { Dispatch } from "../../../store/actions/types";
import { paymentInitializeState } from "../../../store/actions/wallet/payment";
import variables from "../../../theme/variables";
import { Link } from "../../../components/core/typography/Link";
import CodesPositionManualPaymentModal from "./CodesPositionManualPaymentModal";

type NavigationParams = {
  isInvalidAmount?: boolean;
};

type OwnProps = NavigationInjectedProps<NavigationParams>;

type Props = OwnProps &
  ReturnType<typeof mapDispatchToProps> &
  LightModalContextInterface;

type State = Readonly<{
  paymentNoticeNumber: Option<
    ReturnType<typeof PaymentNoticeNumberFromString.decode>
  >;
  organizationFiscalCode: Option<
    ReturnType<typeof OrganizationFiscalCode.decode>
  >;
}>;

const styles = StyleSheet.create({
  whiteBg: {
    backgroundColor: variables.colorWhite
  },

  noLeftMargin: {
    marginLeft: 0
  }
});

const contextualHelpMarkdown: ContextualHelpPropsMarkdown = {
  title: "wallet.insertManually.contextualHelpTitle",
  body: "wallet.insertManually.contextualHelpContent"
};
class ManualDataInsertionScreen extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      paymentNoticeNumber: none,
      organizationFiscalCode: none
    };
  }

  private isFormValid = () =>
    this.state.paymentNoticeNumber.map(isRight).getOrElse(false) &&
    this.state.organizationFiscalCode.map(isRight).getOrElse(false);

  /**
   * This method collects the data from the form and,
   * if it is syntactically correct, it dispatches a
   * request to proceed with the summary of the transaction
   */
  private proceedToSummary = () => {
    // first make sure all the elements have been entered correctly

    this.state.paymentNoticeNumber
      .chain(fromEither)
      .chain(paymentNoticeNumber =>
        this.state.organizationFiscalCode
          .chain(fromEither)
          .chain(organizationFiscalCode =>
            fromEither(
              RptId.decode({
                paymentNoticeNumber,
                organizationFiscalCode
              })
            ).map(rptId => {
              // Set the initial amount to a fixed value (1) because it is not used, waiting to be removed from the API
              const initialAmount = "1" as AmountInEuroCents;
              this.props.navigateToTransactionSummary(rptId, initialAmount);
            })
          )
      );
  };

  public render(): React.ReactNode {
    const primaryButtonProps = {
      disabled: !this.isFormValid(),
      block: true,
      primary: this.isFormValid(),
      onPress: this.proceedToSummary,
      title: I18n.t("global.buttons.continue")
    };

    const secondaryButtonProps = {
      block: true,
      cancel: true,
      onPress: this.props.goBack,
      title: I18n.t("global.buttons.cancel")
    };
    return (
      <BaseScreenComponent
        goBack={true}
        headerTitle={I18n.t("wallet.insertManually.header")}
        contextualHelpMarkdown={contextualHelpMarkdown}
        faqCategories={["wallet_insert_notice_data"]}
      >
        <NavigationEvents />
        <ScrollView style={styles.whiteBg} keyboardShouldPersistTaps="handled">
          <Content scrollEnabled={false}>
            <H1>{I18n.t("wallet.insertManually.title")}</H1>
            <Text>{I18n.t("wallet.insertManually.info")}</Text>
            <TouchableDefaultOpacity>
              <Link onPress={this.showModal}>
                {I18n.t("wallet.insertManually.link")}
              </Link>
            </TouchableDefaultOpacity>

            <Form>
              <Item
                style={styles.noLeftMargin}
                floatingLabel={true}
                error={this.state.paymentNoticeNumber
                  .map(isLeft)
                  .getOrElse(false)}
                success={this.state.paymentNoticeNumber
                  .map(isRight)
                  .getOrElse(false)}
              >
                <Label>{I18n.t("wallet.insertManually.noticeCode")}</Label>
                <Input
                  keyboardType={"numeric"}
                  returnKeyType={"done"}
                  maxLength={18}
                  onChangeText={value => {
                    this.setState({
                      paymentNoticeNumber: some(value)
                        .filter(NonEmptyString.is)
                        .map(_ => PaymentNoticeNumberFromString.decode(_))
                    });
                  }}
                />
              </Item>
              <Item
                style={styles.noLeftMargin}
                floatingLabel={true}
                error={this.state.organizationFiscalCode
                  .map(isLeft)
                  .getOrElse(false)}
                success={this.state.organizationFiscalCode
                  .map(isRight)
                  .getOrElse(false)}
              >
                <Label>{I18n.t("wallet.insertManually.entityCode")}</Label>
                <Input
                  keyboardType={"numeric"}
                  returnKeyType={"done"}
                  maxLength={11}
                  onChangeText={value => {
                    this.setState({
                      organizationFiscalCode: some(value)
                        .filter(NonEmptyString.is)
                        .map(_ => OrganizationFiscalCode.decode(_))
                    });
                  }}
                />
              </Item>
            </Form>
          </Content>
        </ScrollView>
        <FooterWithButtons
          type="TwoButtonsInlineHalf"
          leftButton={secondaryButtonProps}
          rightButton={primaryButtonProps}
        />
      </BaseScreenComponent>
    );
  }
  private showModal = () => {
    Keyboard.dismiss();
    this.props.showModal(
      <CodesPositionManualPaymentModal onCancel={this.props.hideModal} />
    );
  };
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  goBack: () => {
    dispatch(navigateBack());
  },
  navigateToTransactionSummary: (
    rptId: RptId,
    initialAmount: AmountInEuroCents
  ) => {
    Keyboard.dismiss();
    dispatch(paymentInitializeState());
    dispatch(
      navigateToPaymentTransactionSummaryScreen({
        rptId,
        initialAmount,
        isManualPaymentInsertion: true
      })
    );
  }
});

export default connect(
  undefined,
  mapDispatchToProps
)(withLightModalContext(ManualDataInsertionScreen));
