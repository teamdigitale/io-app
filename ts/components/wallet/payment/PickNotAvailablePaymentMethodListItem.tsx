import { View } from "native-base";
import * as React from "react";
import { connect } from "react-redux";
import * as pot from "italia-ts-commons/lib/pot";
import { ImageSourcePropType } from "react-native";
import { GlobalState } from "../../../store/reducers/types";
import { profileNameSurnameSelector } from "../../../store/reducers/profile";
import { getFavoriteWalletId } from "../../../store/reducers/wallet/wallets";
import { PaymentMethod } from "../../../types/pagopa";
import pagoBancomatLogo from "../../../../img/wallet/cards-icons/pagobancomat.png";
import bancomatPayLogo from "../../../../img/wallet/payment-methods/bancomatpay-logo.png";
import satispayLogo from "../../../../img/wallet/cards-icons/satispay.png";
import { useIOBottomSheet } from "../../../utils/bottomSheet";
import { H4 } from "../../core/typography/H4";
import IconFont from "../../ui/IconFont";
import I18n from "../../../i18n";
import { IOColors } from "../../core/variables/IOColors";
import { getCardIconFromBrandLogo } from "../card/Logo";
import PickPaymentMethodBaseListItem from "./PickPaymentMethodBaseListItem";
import { getBancomatOrCreditCardPickMethodDescription } from "../../../utils/payment";

type Props = {
  isFirst: boolean;
  paymentMethod: PaymentMethod;
} & ReturnType<typeof mapStateToProps>;

const BancomatBottomSheetBody = () => (
  <>
    <View spacer={true} large={true} />
    <H4 weight={"Regular"}>
      {I18n.t(
        "wallet.payWith.pickPaymentMethod.notAvailable.bancomat.bottomSheetDescription.text1"
      )}
      <H4>
        {" "}
        {I18n.t(
          "wallet.payWith.pickPaymentMethod.notAvailable.bancomat.bottomSheetDescription.text2"
        )}
      </H4>{" "}
      {I18n.t(
        "wallet.payWith.pickPaymentMethod.notAvailable.bancomat.bottomSheetDescription.text3"
      )}
    </H4>
    <View spacer={true} large={true} />
  </>
);
const ArrivingBottomSheetBody = () => (
  <>
    <View spacer={true} large={true} />
    <H4 weight={"Regular"}>
      {I18n.t(
        "bonus.bpd.details.transaction.detail.summary.calendarBlock.text1"
      )}
      <H4>
        {" "}
        {I18n.t(
          "bonus.bpd.details.transaction.detail.summary.calendarBlock.text2"
        )}
      </H4>
    </H4>
    <View spacer={true} large={true} />
  </>
);
const AmexBottomSheetBody = () => (
  <>
    <View spacer={true} large={true} />
    <H4 weight={"Regular"}>
      {I18n.t(
        "wallet.payWith.pickPaymentMethod.notAvailable.amex.bottomSheetDescription"
      )}
    </H4>
    <View spacer={true} large={true} />
  </>
);
const CoBadgeBottomSheetBody = () => (
  <>
    <View spacer={true} large={true} />
    <H4 weight={"Regular"}>
      {I18n.t(
        "bonus.bpd.details.transaction.detail.summary.calendarBlock.text1"
      )}
      <H4>
        {" "}
        {I18n.t(
          "bonus.bpd.details.transaction.detail.summary.calendarBlock.text2"
        )}
      </H4>
    </H4>
    <View spacer={true} large={true} />
  </>
);

type PaymentMethodInformation = {
  logo: ImageSourcePropType;
  title: string;
  description: string;
  bottomSheetTitle: string;
  bottomSheetBody: JSX.Element;
};

const extractInfoFromPaymentMethod = (
  paymentMethod: PaymentMethod,
  nameSurname: string
): PaymentMethodInformation => {
  switch (paymentMethod.kind) {
    case "CreditCard":
      return {
        logo: getCardIconFromBrandLogo(paymentMethod.info),
        title: paymentMethod.caption,
        description: getBancomatOrCreditCardPickMethodDescription(
          paymentMethod
        ),
        bottomSheetTitle:
          paymentMethod.info.brand === "MAESTRO"
            ? "arriving"
            : paymentMethod.info.brand === "AMEX"
            ? I18n.t(
                "wallet.payWith.pickPaymentMethod.notAvailable.amex.bottomSheetTitle"
              )
            : "cobadge",
        bottomSheetBody:
          paymentMethod.info.brand === "MAESTRO"
            ? ArrivingBottomSheetBody()
            : paymentMethod.info.brand === "AMEX"
            ? AmexBottomSheetBody()
            : CoBadgeBottomSheetBody()
      };
    case "Bancomat":
      return {
        logo: pagoBancomatLogo,
        title: paymentMethod.caption,
        description: getBancomatOrCreditCardPickMethodDescription(
          paymentMethod
        ),
        bottomSheetTitle: I18n.t(
          "wallet.payWith.pickPaymentMethod.notAvailable.bancomat.bottomSheetTitle"
        ),
        bottomSheetBody: BancomatBottomSheetBody()
      };
    case "BPay":
      return {
        logo: bancomatPayLogo,
        title: paymentMethod.caption,
        description: paymentMethod.info.numberObfuscated ?? "",
        bottomSheetTitle: "bpay bottom sheet title",
        bottomSheetBody: ArrivingBottomSheetBody()
      };
    case "Satispay":
      return {
        logo: satispayLogo,
        title: paymentMethod.kind,
        description: nameSurname,
        bottomSheetTitle: "satispay bottom sheet title",
        bottomSheetBody: ArrivingBottomSheetBody()
      };
  }
};

const PickNotAvailablePaymentMethodListItem: React.FC<Props> = (
  props: Props
) => {
  const {
    logo,
    title,
    description,
    bottomSheetTitle,
    bottomSheetBody
  } = extractInfoFromPaymentMethod(
    props.paymentMethod,
    props.nameSurname ?? ""
  );

  const { present } = useIOBottomSheet(bottomSheetBody, bottomSheetTitle, 300);
  return (
    <PickPaymentMethodBaseListItem
      isFirst={props.isFirst}
      isFavourite={
        pot.isSome(props.favoriteWalletId)
          ? props.favoriteWalletId.value === props.paymentMethod.idWallet
          : false
      }
      logo={logo}
      title={title}
      description={description}
      rightElement={
        <IconFont name={"io-notice"} color={IOColors.blue} size={24} />
      }
      onPress={present}
    />
  );
};

const mapStateToProps = (state: GlobalState) => ({
  favoriteWalletId: getFavoriteWalletId(state),
  nameSurname: profileNameSurnameSelector(state)
});
export default connect(mapStateToProps)(PickNotAvailablePaymentMethodListItem);