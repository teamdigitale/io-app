import * as React from "react";
import { useState } from "react";
import _ from "lodash";
import { Body, Container, Left, Right, View } from "native-base";
import {
  FlatList,
  Keyboard,
  ListRenderItemInfo,
  SafeAreaView,
  ScrollView
} from "react-native";
import AppHeader from "../../../../../components/ui/AppHeader";
import ButtonDefaultOpacity from "../../../../../components/ButtonDefaultOpacity";
import IconFont from "../../../../../components/ui/IconFont";
import { H5 } from "../../../../../components/core/typography/H5";
import I18n from "../../../../../i18n";
import { IOStyles } from "../../../../../components/core/variables/IOStyles";
import { H2 } from "../../../../../components/core/typography/H2";
import { categories, Category, orders, OrderType } from "../../utils/filters";
import ItemSeparatorComponent from "../../../../../components/ItemSeparatorComponent";
import FooterWithButtons from "../../../../../components/ui/FooterWithButtons";
import {
  cancelButtonProps,
  confirmButtonProps
} from "../../../bonusVacanze/components/buttons/ButtonConfigurations";
import { LabelledItem } from "../../../../../components/LabelledItem";
import CategoryCheckbox from "./search/CategoryCheckbox";
import OrderOption from "./search/OrderOption";
import { DistanceSlider } from "./search/DistanceSlider";

type Props = {
  onClose: () => void;
  onConfirm: () => void;
  isLocal: boolean;
};

const CgnMerchantsFilters: React.FunctionComponent<Props> = (props: Props) => {
  const [searchValue, setSearchValue] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [checkedCategories, setCheckedCategories] = useState<
    ReadonlyArray<string>
  >([]);
  const [distance, setDistance] = useState<number>(20);
  const [selectedOrder, setSelectedOrder] = useState<string>(
    orders.distance.value
  );

  const onOrderSelect = (value: string) => {
    setSelectedOrder(value);
    Keyboard.dismiss();
  };

  const renderOrderItem = (listItem: ListRenderItemInfo<OrderType>) => (
    <OrderOption
      text={I18n.t(listItem.item.label)}
      value={listItem.item.value}
      checked={selectedOrder.includes(listItem.item.value)}
      onPress={onOrderSelect}
    />
  );

  const onCheckBoxPress = (value: string) => {
    const filteredCategories = checkedCategories.filter(c => c !== value);
    setCheckedCategories(
      checkedCategories.length !== filteredCategories.length
        ? filteredCategories
        : [...checkedCategories, value]
    );
    Keyboard.dismiss();
  };

  const renderCategoryItem = (listItem: ListRenderItemInfo<Category>) => (
    <CategoryCheckbox
      text={I18n.t(listItem.item.nameKey)}
      value={listItem.item.type}
      checked={checkedCategories.includes(listItem.item.type)}
      onPress={onCheckBoxPress}
      icon={listItem.item.icon}
    />
  );

  const onRemoveButton = () => {
    setSearchValue("");
    setSelectedOrder(orders.distance.value);
    setCheckedCategories([]);
    props.onClose();
  };

  const selectedFilters =
    checkedCategories.length + (searchValue.length > 0 ? 1 : 0);

  return (
    <Container>
      <AppHeader>
        <Left />
        <Body style={{ alignItems: "center" }}>
          <H5 weight={"SemiBold"} color={"bluegrey"}>
            {I18n.t("bonus.cgn.merchantsList.filter.title")}
          </H5>
        </Body>
        <Right>
          <ButtonDefaultOpacity onPress={props.onClose} transparent={true}>
            <IconFont name="io-close" />
          </ButtonDefaultOpacity>
        </Right>
      </AppHeader>
      <SafeAreaView style={IOStyles.flex}>
        <ScrollView
          style={[IOStyles.flex]}
          bounces={false}
          keyboardShouldPersistTaps={"handled"}
        >
          <View style={IOStyles.horizontalContentPadding}>
            <H2>{I18n.t("bonus.cgn.merchantsList.filter.searchTitle")}</H2>
            <LabelledItem
              type="text"
              inputProps={{
                value: searchValue,
                onChangeText: setSearchValue,
                placeholder: I18n.t(
                  "bonus.cgn.merchantsList.filter.inputPlaceholder"
                )
              }}
              icon="io-search"
            />
            <View spacer large />
            {props.isLocal && (
              <>
                <H2>{I18n.t("bonus.cgn.merchantsList.filter.addressTitle")}</H2>
                <LabelledItem
                  type="text"
                  inputProps={{
                    value: address,
                    onChangeText: setAddress,
                    placeholder: I18n.t(
                      "bonus.cgn.merchantsList.filter.addressPlaceholder"
                    )
                  }}
                  icon="io-place"
                />
                <View spacer />
                <DistanceSlider
                  value={distance}
                  onValueChange={setDistance}
                  disabled={address.length === 0}
                />
                <View spacer large />
              </>
            )}
            <H2>{I18n.t("bonus.cgn.merchantsList.filter.categories")}</H2>
            <View spacer small />
            <FlatList
              data={categories}
              keyExtractor={cat => cat.type}
              ItemSeparatorComponent={() => (
                <ItemSeparatorComponent noPadded={true} />
              )}
              renderItem={renderCategoryItem}
              keyboardShouldPersistTaps={"handled"}
            />
            <View spacer large />
            {props.isLocal && (
              <>
                <H2>{I18n.t("bonus.cgn.merchantsList.filter.orderTitle")}</H2>
                <View spacer small />
                <FlatList
                  data={_.values(orders)}
                  keyExtractor={ord => ord.value}
                  ItemSeparatorComponent={() => (
                    <ItemSeparatorComponent noPadded={true} />
                  )}
                  renderItem={renderOrderItem}
                  keyboardShouldPersistTaps={"handled"}
                />
              </>
            )}
          </View>
        </ScrollView>
        <FooterWithButtons
          type={"TwoButtonsInlineHalf"}
          leftButton={cancelButtonProps(
            onRemoveButton,
            I18n.t("bonus.cgn.merchantsList.filter.cta.cancel")
          )}
          rightButton={confirmButtonProps(
            props.onConfirm,
            I18n.t("bonus.cgn.merchantsList.filter.cta.confirm", {
              defaultValue: I18n.t(
                "bonus.cgn.merchantsList.filter.cta.confirm.other",
                {
                  count: selectedFilters
                }
              ),
              count: selectedFilters
            })
          )}
        />
      </SafeAreaView>
    </Container>
  );
};

export default CgnMerchantsFilters;
