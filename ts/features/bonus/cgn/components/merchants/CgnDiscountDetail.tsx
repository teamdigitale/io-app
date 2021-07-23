import * as React from "react";
import { View } from "native-base";
import { StyleSheet } from "react-native";
import { TouchableWithoutFeedback } from "@gorhom/bottom-sheet";
import { Millisecond } from "italia-ts-commons/lib/units";
import { useIOBottomSheet } from "../../../../../utils/bottomSheet";
import I18n from "../../../../../i18n";
import { IOStyles } from "../../../../../components/core/variables/IOStyles";
import { H3 } from "../../../../../components/core/typography/H3";
import { H5 } from "../../../../../components/core/typography/H5";
import { H4 } from "../../../../../components/core/typography/H4";
import IconFont from "../../../../../components/ui/IconFont";
import { IOColors } from "../../../../../components/core/variables/IOColors";
import { clipboardSetStringWithFeedback } from "../../../../../utils/clipboard";
import { BaseTypography } from "../../../../../components/core/typography/BaseTypography";
import { addEvery } from "../../../../../utils/strings";
import { Discount } from "../../../../../../definitions/cgn/merchants/Discount";
import CgnDiscountValueBox from "./CgnDiscountValueBox";

type Props = {
  discount: Discount;
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row"
  },
  verticalPadding: {
    paddingBottom: 16
  },
  discountValueBox: {
    borderRadius: 6.5,
    paddingVertical: 5,
    width: 40,
    textAlign: "center",
    backgroundColor: "#EB9505"
  },
  container: {
    paddingTop: 16
  },
  codeContainer: { alignItems: "center", justifyContent: "space-between" },
  codeText: {
    fontSize: 20
  },
  flexEnd: { alignSelf: "flex-end" },
  discountValue: { textAlign: "center", lineHeight: 30 }
});

const FEEDBACK_TIMEOUT = 3000 as Millisecond;

const CATEGORY_ICON_SIZE = 22;
const COPY_ICON_SIZE = 24;

const CgnDiscountDetail: React.FunctionComponent<Props> = ({
  discount
}: Props) => {
  const [isTap, setIsTap] = React.useState(false);
  const timerRetry = React.useRef<number | undefined>(undefined);

  React.useEffect(
    () => () => {
      clearTimeout(timerRetry.current);
    },
    []
  );

  const handleCopyPress = () => {
    if (discount.staticCode) {
      setIsTap(true);
      clipboardSetStringWithFeedback(discount.staticCode);
      // eslint-disable-next-line functional/immutable-data
      timerRetry.current = setTimeout(() => setIsTap(false), FEEDBACK_TIMEOUT);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* TODO when available and defined the icon name should be defined through a map of category codes */}
        <IconFont
          name={"io-theater"}
          size={CATEGORY_ICON_SIZE}
          color={IOColors.bluegrey}
        />
        <View hspacer small />
        <H5 weight={"SemiBold"} color={"bluegrey"}>
          {discount.productCategories[0].toLocaleUpperCase()}
        </H5>
      </View>
      <View spacer />
      <H3 accessible={true} accessibilityRole={"header"}>
        {I18n.t("bonus.cgn.merchantDetail.title.description")}
      </H3>
      <H4 weight={"Regular"}>{discount.description}</H4>
      <View spacer />
      <H3 accessible={true} accessibilityRole={"header"}>
        {I18n.t("bonus.cgn.merchantDetail.title.validity")}
      </H3>
      <H4 weight={"Regular"}>{discount.description}</H4>
      {discount.staticCode && (
        <>
          <View spacer small />
          <H3 accessible={true} accessibilityRole={"header"}>
            {I18n.t("bonus.cgn.merchantDetail.title.discountCode")}
          </H3>
          <TouchableWithoutFeedback
            onPress={handleCopyPress}
            accessible={true}
            accessibilityRole={"button"}
            accessibilityHint={I18n.t("bonus.cgn.accessibility.code")}
          >
            <View style={[styles.row, styles.codeContainer]}>
              <BaseTypography
                weight={"Bold"}
                color={"bluegreyDark"}
                font={"RobotoMono"}
                style={styles.codeText}
              >
                {addEvery(discount.staticCode, " ", 3)}
              </BaseTypography>
              <IconFont
                name={isTap ? "io-complete" : "io-copy"}
                size={COPY_ICON_SIZE}
                color={IOColors.blue}
                style={styles.flexEnd}
              />
            </View>
          </TouchableWithoutFeedback>
        </>
      )}
      <View spacer />
      {discount.condition && (
        <>
          <H3 accessible={true} accessibilityRole={"header"}>
            {I18n.t("bonus.cgn.merchantDetail.title.conditions")}
          </H3>
          <H4 weight={"Regular"}>{discount.condition}</H4>
        </>
      )}
    </View>
  );
};

const CgnDiscountDetailHeader = ({ discount }: Props) => (
  <View style={[IOStyles.row, { alignItems: "center" }]}>
    <CgnDiscountValueBox value={discount.discount} small />
    <View hspacer />
    <H3 style={IOStyles.flex}>{discount.name}</H3>
  </View>
);

export const useCgnDiscountDetailBottomSheet = (discount: Discount) =>
  useIOBottomSheet(
    <CgnDiscountDetail {...{ discount }} />,
    <CgnDiscountDetailHeader {...{ discount }} />,
    520
  );
