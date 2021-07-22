import * as React from "react";
import { connect } from "react-redux";
import { Keyboard, SafeAreaView } from "react-native";
import { View } from "native-base";
import { debounce } from "lodash";
import { Millisecond } from "italia-ts-commons/lib/units";
import { GlobalState } from "../../../../../store/reducers/types";
import { Dispatch } from "../../../../../store/actions/types";
import BaseScreenComponent from "../../../../../components/screens/BaseScreenComponent";
import { IOStyles } from "../../../../../components/core/variables/IOStyles";
import I18n from "../../../../../i18n";
import { emptyContextualHelp } from "../../../../../utils/emptyContextualHelp";
import { availableMerchants } from "../../__mock__/availableMerchants";
import { navigateToCgnMerchantDetail } from "../../navigation/actions";
import CgnMerchantsListView from "../../components/merchants/CgnMerchantsListView";
import { H1 } from "../../../../../components/core/typography/H1";
import { LabelledItem } from "../../../../../components/LabelledItem";

type Props = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>;

export type TmpMerchantType = {
  name: string;
  category: string;
  location: string;
};

const DEBOUNCE_SEARCH: Millisecond = 300 as Millisecond;
/**
 * Screen that renders the list of the merchants which have an active discount for CGN
 * @param props
 * @constructor
 */
const CgnMerchantsListScreen: React.FunctionComponent<Props> = (
  props: Props
) => {
  const [searchValue, setSearchValue] = React.useState("");
  const [merchantList, setMerchantsList] = React.useState(props.merchants);

  const performSearch = (
    text: string,
    merchantList: ReadonlyArray<TmpMerchantType>
  ) => {
    // if search text is empty, restore the whole list
    if (text.length === 0) {
      setMerchantsList(props.merchants);
      return;
    }
    const resultList = merchantList.filter(
      m => m.name.toLowerCase().indexOf(text.toLowerCase()) > -1
    );
    setMerchantsList(resultList);
  };

  const debounceRef = React.useRef(debounce(performSearch, DEBOUNCE_SEARCH));

  React.useEffect(() => {
    debounceRef.current(searchValue, props.merchants);
  }, [searchValue, props.merchants]);

  const onItemPress = () => {
    // TODO Add the dispatch of merchant selected when the complete workflow is available
    props.navigateToMerchantDetail();
    Keyboard.dismiss();
  };

  return (
    <BaseScreenComponent
      goBack
      headerTitle={I18n.t("bonus.cgn.merchantsList.navigationTitle")}
      contextualHelp={emptyContextualHelp}
    >
      <SafeAreaView style={IOStyles.flex}>
        <View style={[IOStyles.horizontalContentPadding]}>
          <H1>{I18n.t("bonus.cgn.merchantsList.screenTitle")}</H1>
          <LabelledItem
            type="text"
            inputProps={{
              value: searchValue,
              autoFocus: true,
              onChangeText: setSearchValue,
              placeholder: I18n.t("global.buttons.search")
            }}
          />
        </View>
        <CgnMerchantsListView
          merchantList={merchantList}
          onItemPress={onItemPress}
        />
      </SafeAreaView>
    </BaseScreenComponent>
  );
};

const mapStateToProps = (_: GlobalState) => ({
  // FIXME replace with selector when available
  merchants: availableMerchants
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  navigateToMerchantDetail: () => dispatch(navigateToCgnMerchantDetail())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CgnMerchantsListScreen);
