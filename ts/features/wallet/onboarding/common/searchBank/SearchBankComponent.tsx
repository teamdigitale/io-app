import { View } from "native-base";
import * as React from "react";
import {
  FlatList,
  ListRenderItemInfo,
  ActivityIndicator,
  Keyboard
} from "react-native";
import { debounce } from "lodash";
import I18n from "../../../../../i18n";
import { Abi } from "../../../../../../definitions/pagopa/walletv2/Abi";
import { BankPreviewItem } from "../../bancomat/components/BankPreviewItem";
import { sortAbiByName } from "../../bancomat/utils/abi";
import { LabelledItem } from "../../../../../components/LabelledItem";

type Props = {
  bankList: ReadonlyArray<Abi>;
  isLoading: boolean;
  onItemPress: (abi: string) => void;
};

export const SearchBankComponent: React.FunctionComponent<Props> = (
  props: Props
) => {
  const [searchText, setSearchText] = React.useState("");
  const [filteredList, setFilteredList] = React.useState<ReadonlyArray<Abi>>(
    []
  );
  const { isLoading } = props;

  const performSearch = (text: string, bankList: ReadonlyArray<Abi>) => {
    if (text.length === 0) {
      setFilteredList([]);
      return;
    }
    const resultList = bankList.filter(
      bank =>
        (bank.abi && bank.abi.toLowerCase().indexOf(text.toLowerCase()) > -1) ||
        (bank.name && bank.name.toLowerCase().indexOf(text.toLowerCase()) > -1)
    );
    setFilteredList(sortAbiByName(resultList));
  };
  const debounceRef = React.useRef(debounce(performSearch, 300));

  React.useEffect(() => {
    debounceRef.current(searchText, props.bankList);
  }, [searchText, props.bankList]);

  const handleFilter = (text: string) => {
    setSearchText(text);
  };

  const keyExtractor = (bank: Abi, index: number): string =>
    bank.abi ? bank.abi : `abi_item_${index}`;

  const renderListItem = (isList: boolean) => (
    info: ListRenderItemInfo<Abi>
  ) => (
    <BankPreviewItem
      bank={info.item}
      inList={isList}
      onPress={(abi: string) => {
        props.onItemPress(abi);
        setSearchText("");
        Keyboard.dismiss();
      }}
    />
  );

  return (
    <>
      <LabelledItem
        type="text"
        label={isLoading ? undefined : I18n.t("wallet.searchAbi.bankName")}
        inputProps={{
          value: searchText,
          autoFocus: true,
          onChangeText: handleFilter,
          disabled: isLoading,
          placeholder: isLoading
            ? I18n.t("wallet.searchAbi.loading")
            : undefined
        }}
        icon={isLoading ? undefined : "io-search"}
      />
      <View spacer={true} />
      {isLoading ? (
        <>
          <View spacer={true} large={true} />
          <ActivityIndicator
            color={"black"}
            size={"large"}
            accessible={false}
            importantForAccessibility={"no-hide-descendants"}
            accessibilityElementsHidden={true}
          />
        </>
      ) : (
        <FlatList
          data={filteredList}
          renderItem={renderListItem(true)}
          keyExtractor={keyExtractor}
          keyboardShouldPersistTaps={"handled"}
        />
      )}
    </>
  );
};
