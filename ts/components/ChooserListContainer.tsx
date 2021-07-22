import { none, Option, some } from "fp-ts/lib/Option";
import { Millisecond } from "italia-ts-commons/lib/units";
import { debounce } from "lodash";
import { Body, Content, Right, View } from "native-base";
import * as React from "react";
import { ComponentProps } from "react";
import {
  BackHandler,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  StyleSheet
} from "react-native";
import I18n from "../i18n";
import customVariables from "../theme/variables";
import { areSetEqual } from "../utils/options";
import ButtonDefaultOpacity from "./ButtonDefaultOpacity";
import ChooserList from "./ChooserList";
import ChooserListItem from "./ChooserListItem";
import ChooserListSearch from "./ChooserListSearch";
import {
  InjectedWithItemsSelectionProps,
  withItemsSelection
} from "./helpers/withItemsSelection";
import { LabelledItem } from "./LabelledItem";
import AppHeader from "./ui/AppHeader";
import FooterWithButtons from "./ui/FooterWithButtons";
import IconFont from "./ui/IconFont";

type OwnProps<T> = {
  items: ReadonlyArray<T>;
  initialSelectedItemIds: Option<Set<string>>;
  keyExtractor: (item: T) => string;
  itemTitleExtractor: (item: T) => string;
  onCancel: () => void;
  onSave: (selectedItemIds: Option<Set<string>>) => void;
  isRefreshEnabled: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  matchingTextPredicate?: (item: T, searchText: string) => boolean;
  noSearchResultsSourceIcon?: ImageSourcePropType;
  noSearchResultsSubtitle?: string;
};

type OtherProps<T> = OwnProps<T> &
  Pick<ComponentProps<typeof ChooserListItem>, "itemIconComponent">;

type Props<T> = OtherProps<T> & InjectedWithItemsSelectionProps;

type State = {
  searchText: Option<string>;
  debouncedSearchText: Option<string>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flex: 1
  },
  headerNoSearch: {
    height: customVariables.contentPadding / 2
  }
});
// The number of milliseconds to delay for search
const searchDelay = 300 as Millisecond;

/**
 * A component for view, search and select a list of items
 */
class ChooserListContainer<T> extends React.PureComponent<Props<T>, State> {
  constructor(props: Props<T>) {
    super(props);
    this.state = {
      // The text entered by the user for the search
      searchText: this.props.matchingTextPredicate ? some("") : none,
      // The debounced text used to avoid executing a search for each typed char
      debouncedSearchText: this.props.matchingTextPredicate ? some("") : none
    };
  }

  public componentDidMount() {
    const { initialSelectedItemIds } = this.props;
    // Set the initial set of selected items ids if is any
    if (
      initialSelectedItemIds !== undefined &&
      initialSelectedItemIds.isSome()
    ) {
      this.props.setSelectedItemIds(initialSelectedItemIds);
    }

    BackHandler.addEventListener("hardwareBackPress", this.handleBackPress);
  }

  public componentWillUnmount() {
    BackHandler.removeEventListener("hardwareBackPress", this.handleBackPress);
  }

  private onPressCancel = () => {
    this.props.onCancel();
  };

  private handleBackPress = () => {
    this.props.onCancel();
    return true;
  };

  private onPressSave = () => {
    this.props.onSave(this.props.selectedItemIds);
  };

  /**
   * Selection
   */
  private handleOnPressItem = (id: string) => {
    this.props.toggleItemSelection(id);
  };

  /**
   * Header SearchBar
   */
  private renderSearchBar() {
    const { searchText } = this.state;
    return (
      <React.Fragment>
        <Body />
        <Right>
          {searchText.isSome() ? (
            <LabelledItem
              type="text"
              inputProps={{
                placeholder: I18n.t("global.actions.search"),
                value: searchText.value,
                onChangeText: this.onSearchTextChange,
                autoFocus: true
              }}
              icon="io-close"
              iconPosition="right"
              onPress={this.onPressCancel}
              accessibilityLabelIcon={I18n.t("global.buttons.close")}
            />
          ) : (
            <ButtonDefaultOpacity
              onPress={this.handleSearchPress}
              transparent={true}
            >
              <IconFont
                name="io-search"
                accessible={true}
                accessibilityLabel={I18n.t("global.actions.search")}
              />
            </ButtonDefaultOpacity>
          )}
        </Right>
      </React.Fragment>
    );
  }

  /**
   * Search
   */
  private handleSearchPress = () => {
    this.setState({
      searchText: some("")
    });
  };

  private onSearchTextChange = (text: string) => {
    this.setState({
      searchText: some(text)
    });
    this.updateDebouncedSearchText(text);
  };

  private updateDebouncedSearchText = debounce(
    (text: string) =>
      this.setState({
        debouncedSearchText: some(text)
      }),
    searchDelay
  );

  /**
   * Footer
   */
  private renderFooterButtons(hasNoNewSelection: boolean) {
    const cancelButtonProps = {
      block: true,
      light: true,
      bordered: true,
      onPress: this.onPressCancel,
      title: I18n.t("global.buttons.cancel")
    };
    const saveButtonProps = {
      block: true,
      primary: true,
      disabled: hasNoNewSelection,
      onPress: this.onPressSave,
      title: I18n.t("global.buttons.saveSelection")
    };

    return (
      <FooterWithButtons
        type={"TwoButtonsInlineThird"}
        leftButton={cancelButtonProps}
        rightButton={saveButtonProps}
      />
    );
  }

  /**
   * Render Search component
   */
  private renderSearch = () => {
    const {
      items,
      matchingTextPredicate,
      keyExtractor,
      itemTitleExtractor,
      noSearchResultsSourceIcon,
      noSearchResultsSubtitle,
      selectedItemIds,
      itemIconComponent
    } = this.props;
    const { debouncedSearchText } = this.state;
    return (
      <ChooserListSearch<T>
        listState={items}
        keyExtractor={keyExtractor}
        itemTitleExtractor={itemTitleExtractor}
        selectedItemIds={selectedItemIds}
        itemIconComponent={itemIconComponent}
        onPressItem={this.handleOnPressItem}
        searchText={debouncedSearchText.getOrElse("")}
        matchingTextPredicate={matchingTextPredicate}
        noSearchResultsSourceIcon={noSearchResultsSourceIcon}
        noSearchResultsSubtitle={noSearchResultsSubtitle}
      />
    );
  };

  public render() {
    const {
      isRefreshEnabled,
      isRefreshing,
      items,
      onRefresh,
      matchingTextPredicate,
      keyExtractor,
      selectedItemIds,
      itemTitleExtractor,
      itemIconComponent
    } = this.props;

    const isOnRefresh =
      isRefreshEnabled && (isRefreshing || false) && onRefresh !== undefined;
    const refreshProps = {
      onRefresh,
      isRefreshing: isOnRefresh
    };

    return (
      <View style={styles.container}>
        <AppHeader
          style={matchingTextPredicate ? undefined : styles.headerNoSearch}
        >
          {matchingTextPredicate && this.renderSearchBar()}
        </AppHeader>
        <Content noPadded={true} style={styles.content}>
          <View>
            {matchingTextPredicate
              ? this.renderSearch()
              : items.length > 0 && (
                  <ChooserList<T>
                    {...refreshProps}
                    items={items}
                    keyExtractor={keyExtractor}
                    itemTitleExtractor={itemTitleExtractor}
                    onPressItem={this.handleOnPressItem}
                    selectedItemIds={selectedItemIds}
                    itemIconComponent={itemIconComponent}
                  />
                )}
          </View>
        </Content>
        <KeyboardAvoidingView
          behavior={Platform.OS === "android" ? "height" : "padding"}
          keyboardVerticalOffset={Platform.select({
            ios: 0,
            android: customVariables.contentPadding
          })}
        >
          {this.renderFooterButtons(
            areSetEqual(this.props.initialSelectedItemIds, selectedItemIds)
          )}
        </KeyboardAvoidingView>
      </View>
    );
  }
}

export default <T extends Record<string, unknown>>() => {
  const hocComponent = (props: Props<T>) => {
    const {
      selectedItemIds,
      toggleItemSelection,
      resetSelection,
      setSelectedItemIds,
      ...otherProps
    } = props;
    return (
      <ChooserListContainer<T>
        selectedItemIds={selectedItemIds}
        toggleItemSelection={toggleItemSelection}
        resetSelection={resetSelection}
        setSelectedItemIds={setSelectedItemIds}
        {...otherProps}
      />
    );
  };
  return withItemsSelection(hocComponent);
};
