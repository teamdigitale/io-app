import * as React from "react";
import { View } from "native-base";
import { StyleSheet } from "react-native";
import IconFont from "../../../../../components/ui/IconFont";
import { IOColors } from "../../../../../components/core/variables/IOColors";
import { H5 } from "../../../../../components/core/typography/H5";
import { H4 } from "../../../../../components/core/typography/H4";
import { ShadowBox } from "../../../bpd/screens/details/components/summary/base/ShadowBox";
import { IOStyles } from "../../../../../components/core/variables/IOStyles";
import TouchableDefaultOpacity from "../../../../../components/TouchableDefaultOpacity";
import { Discount } from "../../../../../../definitions/cgn/merchants/Discount";
import { useCgnDiscountDetailBottomSheet } from "./CgnDiscountDetail";
import CgnDiscountValueBox from "./CgnDiscountValueBox";

type Props = {
  discount: Discount;
};

const styles = StyleSheet.create({
  container: { justifyContent: "space-between", alignItems: "center" },
  row: {
    flexDirection: "row"
  },
  verticalPadding: {
    flex: 1,
    paddingVertical: 16
  }
});

const CgnMerchantDiscountItem: React.FunctionComponent<Props> = ({
  discount
}: Props) => {
  const { present } = useCgnDiscountDetailBottomSheet(discount);
  return (
    <TouchableDefaultOpacity style={styles.verticalPadding} onPress={present}>
      <ShadowBox>
        <View style={[styles.row, styles.container]}>
          <View style={IOStyles.flex}>
            <View style={[styles.row, styles.container]}>
              {/* TODO when available and defined the icon name should be defined through a map of category codes */}
              <IconFont
                name={"io-theater"}
                size={22}
                color={IOColors.bluegrey}
              />
              <View hspacer small />
              <View style={IOStyles.flex}>
                {/* FIXME properly handle multiple categories on discount */}
                <H5 weight={"SemiBold"} color={"bluegrey"}>
                  {discount.productCategories[0].toLocaleUpperCase()}
                </H5>
              </View>
            </View>
            <View spacer xsmall />
            <View style={IOStyles.flex}>
              <H4 weight={"SemiBold"} color={"bluegreyDark"}>
                {discount.name}
              </H4>
            </View>
          </View>
          <CgnDiscountValueBox value={discount.discount} small={true} />
        </View>
      </ShadowBox>
    </TouchableDefaultOpacity>
  );
};

export default CgnMerchantDiscountItem;
