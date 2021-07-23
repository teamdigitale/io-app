import * as React from "react";
import { View } from "native-base";
import { FlatList, ListRenderItemInfo } from "react-native";
import { IOStyles } from "../../../../../components/core/variables/IOStyles";
import ItemSeparatorComponent from "../../../../../components/ItemSeparatorComponent";
import { EdgeBorderComponent } from "../../../../../components/screens/EdgeBorderComponent";
import { OfflineMerchant } from "../../../../../../definitions/cgn/merchants/OfflineMerchant";
import { OnlineMerchant } from "../../../../../../definitions/cgn/merchants/OnlineMerchant";
import { Merchant } from "../../../../../../definitions/cgn/merchants/Merchant";
import CgnMerchantListItem from "./CgnMerchantListItem";

type Props = {
  merchantList: ReadonlyArray<OfflineMerchant | OnlineMerchant>;
  onItemPress: (id: Merchant["id"]) => void;
};

// Component that renders the list of merchants as a FlatList
const CgnMerchantsListView: React.FunctionComponent<Props> = (props: Props) => {
  const renderListItem = (
    listItem: ListRenderItemInfo<OfflineMerchant | OnlineMerchant>
  ) => {
    if (OfflineMerchant.is(listItem.item)) {
      return (
        <CgnMerchantListItem
          category={listItem.item.productCategories[0]}
          name={listItem.item.name}
          location={listItem.item.address.full_address}
          onPress={() => props.onItemPress(listItem.item.id)}
        />
      );
    }
    return (
      <CgnMerchantListItem
        category={listItem.item.productCategories[0]}
        name={listItem.item.name}
        location={listItem.item.websiteUrl}
        onPress={() => props.onItemPress(listItem.item.id)}
      />
    );
  };

  return (
    <View style={[IOStyles.horizontalContentPadding, IOStyles.flex]}>
      <FlatList
        scrollEnabled={true}
        data={props.merchantList}
        ItemSeparatorComponent={() => (
          <ItemSeparatorComponent noPadded={true} />
        )}
        renderItem={renderListItem}
        keyExtractor={c => c.id}
        keyboardShouldPersistTaps={"handled"}
        ListFooterComponent={
          props.merchantList.length > 0 && <EdgeBorderComponent />
        }
      />
    </View>
  );
};

export default CgnMerchantsListView;
