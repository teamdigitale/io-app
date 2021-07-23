import { fromNullable } from "fp-ts/lib/Option";
import { capitalize } from "lodash";
import { Text, View } from "native-base";
import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { CreatedMessageWithContent } from "../../../definitions/backend/CreatedMessageWithContent";
import { ServicePublic } from "../../../definitions/backend/ServicePublic";
import I18n from "../../i18n";
import { navigateToWalletHome } from "../../store/actions/navigation";
import { PaidReason } from "../../store/reducers/entities/payments";
import customVariables from "../../theme/variables";
import {
  format,
  formatDateAsDay,
  formatDateAsLocal,
  formatDateAsMonth
} from "../../utils/dates";
import {
  isExpired,
  isExpiring,
  paymentExpirationInfo
} from "../../utils/messages";
import IconFont from "../ui/IconFont";
import variables from "../../theme/variables";
import { IOColors } from "../core/variables/IOColors";
import { Link } from "../core/typography/Link";
import CalendarIconComponent from "./CalendarIconComponent";

type OwnProps = {
  message: CreatedMessageWithContent;
  service?: ServicePublic;
  payment?: PaidReason;
};

type Props = OwnProps & ReturnType<typeof mapDispatchToProps>;

type PaymentStatus = "paid" | "expiring" | "expired" | "valid";

const CALENDAR_ICON_HEIGHT = 40;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: customVariables.contentPadding,
    paddingVertical: customVariables.appHeaderPaddingHorizontal,
    alignItems: "center",
    minHeight:
      CALENDAR_ICON_HEIGHT + 2 * customVariables.appHeaderPaddingHorizontal
  },
  text: {
    flex: 1,
    paddingRight: 50,
    paddingLeft: 5
  },
  highlight: {
    color: customVariables.brandHighlight
  },
  center: {
    justifyContent: "center"
  },
  padded: {
    paddingHorizontal: variables.contentPadding
  },
  messagePaidBg: {
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: IOColors.aqua
  }
});

// Every possible state of the payment has it's component
const PaidTextContent: React.FunctionComponent<{
  onPress: () => void;
}> = ({ onPress }) => (
  <>
    {`${I18n.t("messages.cta.payment.paid")} `}
    <Link onPress={onPress}>{I18n.t("wallet.wallet")}</Link>
  </>
);

const ValidOrExpiringTextContent: React.FunctionComponent<{
  date: string;
}> = ({ date }) => (
  <>
    {I18n.t("messages.cta.payment.expiringOrValidAlert.block1")}
    <Text bold={true}>{` ${date} `}</Text>
  </>
);

const Expired: React.FunctionComponent<{
  time: string;
  date: string;
}> = ({ time, date }) => (
  <>
    {I18n.t("messages.cta.payment.expiredAlert.block1")}
    <Text bold={true} white={true}>{` ${time} `}</Text>
    {I18n.t("messages.cta.payment.expiredAlert.block2")}
    <Text bold={true} white={true}>{` ${date}`}</Text>
  </>
);

const TextContent: React.FunctionComponent<{
  status: PaymentStatus;
  dueDate: Date;
  onPaidPress: () => void;
}> = ({ status, dueDate, onPaidPress }) => {
  const time = format(dueDate, "HH:mm");
  const date = formatDateAsLocal(dueDate, true, true);
  switch (status) {
    case "paid":
      return <PaidTextContent onPress={onPaidPress} />;
    case "expired":
      return <Expired time={time} date={date} />;
    case "valid":
    case "expiring":
      return <ValidOrExpiringTextContent date={date} />;
  }
};

const getCalendarIconBackgoundColor = (status: PaymentStatus) => {
  switch (status) {
    case "paid":
      return customVariables.lighterGray;
    case "expired":
      return customVariables.colorWhite;
    case "expiring":
    case "valid":
      return customVariables.brandDarkGray;
  }
};

const getCalendarTextColor = (status: PaymentStatus) => {
  switch (status) {
    case "paid":
    case "expiring":
    case "valid":
      return customVariables.colorWhite;
    case "expired":
      return customVariables.brandDarkGray;
  }
};

// The calendar icon is shown if:
// - the payment related to the message is not yet paid
// - the message has a due date
const CalendarIcon: React.FunctionComponent<{
  status: PaymentStatus;
  dueDate: Date;
}> = ({ status, dueDate }) => {
  const iconBackgoundColor = getCalendarIconBackgoundColor(status);

  const textColor = getCalendarTextColor(status);

  return (
    <CalendarIconComponent
      month={capitalize(formatDateAsMonth(dueDate))}
      day={formatDateAsDay(dueDate)}
      backgroundColor={iconBackgoundColor}
      textColor={textColor}
    />
  );
};

const bannerStyle = (status: PaymentStatus): ViewStyle => {
  switch (status) {
    case "paid":
    case "expiring":
    case "valid":
      return { backgroundColor: customVariables.brandGray };
    case "expired":
      return { backgroundColor: customVariables.brandDarkGray };
  }
};

const isPaymentExpired = (message: CreatedMessageWithContent): boolean =>
  paymentExpirationInfo(message).fold(false, isExpired);

const isPaymentExpiring = (message: CreatedMessageWithContent): boolean =>
  paymentExpirationInfo(message).fold(false, isExpiring);

const paid = (payment: PaidReason | undefined): boolean =>
  payment !== undefined;

const calculatePaymentStatus = (
  payment: PaidReason | undefined,
  message: CreatedMessageWithContent
): PaymentStatus => {
  if (paid(payment)) {
    return "paid";
  } else if (isPaymentExpired(message)) {
    return "expired";
  } else if (isPaymentExpiring(message)) {
    return "expiring";
  } else {
    return "valid";
  }
};

const getNoticePaid = () => (
  <View style={styles.messagePaidBg}>
    <IconFont name="io-complete" color={IOColors.bluegreyDark} />
    <Text style={[styles.padded, { color: IOColors.bluegreyDark }]}>
      {I18n.t("wallet.errors.PAYMENT_DUPLICATED")}
    </Text>
  </View>
);

/**
 * A component to show detailed info about the due date of a message
 */
const MessageDueDateBar: React.FunctionComponent<Props> = ({
  onGoToWallet,
  message,
  payment
}) => {
  /**
   * Display description on message deadlines
   */

  const paymentStatus = calculatePaymentStatus(payment, message);
  if (paymentStatus === "paid") {
    return getNoticePaid();
  }
  return fromNullable(message.content.due_date).fold(null, dueDate => (
    <>
      <View style={[styles.container, bannerStyle(paymentStatus)]}>
        <>
          <CalendarIcon status={paymentStatus} dueDate={dueDate} />
          <View hspacer={true} small={true} />

          <Text style={styles.text} white={paymentStatus === "expired"}>
            <TextContent
              status={paymentStatus}
              dueDate={dueDate}
              onPaidPress={onGoToWallet}
            />
          </Text>
        </>
      </View>
      <View spacer={true} large={true} />
    </>
  ));
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  onGoToWallet: () => dispatch(navigateToWalletHome())
});

export default connect(undefined, mapDispatchToProps)(MessageDueDateBar);
