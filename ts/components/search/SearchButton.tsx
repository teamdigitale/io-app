import debounce from "lodash/debounce";
import * as React from "react";
import { connect } from "react-redux";

import { fromNullable, none, Option, some } from "fp-ts/lib/Option";
import I18n from "../../i18n";
import {
  disableSearch,
  searchMessagesEnabled,
  searchServicesEnabled,
  updateSearchText
} from "../../store/actions/search";
import { Dispatch } from "../../store/actions/types";
import ButtonDefaultOpacity from "../ButtonDefaultOpacity";
import IconFont from "../ui/IconFont";
import { LabelledItem } from "../LabelledItem";

export const MIN_CHARACTER_SEARCH_TEXT = 3;

export type SearchType = "Messages" | "Services";

interface OwnProps {
  color?: string;
  searchType?: SearchType;
  // if this handler is defined it will be called in place of dispatching actions about search activation (see handleSearchPress)
  onSearchTap?: () => void;
}

type Props = OwnProps & ReturnType<typeof mapDispatchToProps>;

type State = {
  searchText: Option<string>;
  debouncedSearchText: Option<string>;
};

class SearchButton extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      searchText: none,
      debouncedSearchText: none
    };
  }

  public render() {
    const { searchText } = this.state;
    return (
      <React.Fragment>
        {searchText.isSome() ? (
          <LabelledItem
            type="text"
            hasNavigationEvents
            inputProps={{
              placeholder: I18n.t("global.actions.search"),
              value: searchText.value,
              onChangeText: this.onSearchTextChange,
              autoFocus: true
            }}
            icon="io-close"
            iconPosition="right"
            onPress={this.onSearchDisable}
            accessibilityLabelIcon={I18n.t("global.buttons.close")}
            iconColor={this.props.color}
          />
        ) : (
          <ButtonDefaultOpacity
            hasFullHitSlop
            onPress={this.handleSearchPress}
            transparent={true}
            accessibilityLabel={I18n.t("global.buttons.search")}
          >
            <IconFont name="io-search" color={this.props.color} />
          </ButtonDefaultOpacity>
        )}
      </React.Fragment>
    );
  }

  private handleSearchPress = () => {
    const { onSearchTap } = this.props;

    fromNullable(onSearchTap).foldL(
      () => {
        const { searchText } = this.state;
        this.setState({
          searchText: some("")
        });
        this.props.dispatchSearchText(searchText);
        this.props.dispatchSearchEnabled(true);
      },
      ost => ost()
    );
  };

  private onSearchTextChange = (text: string) => {
    this.setState({
      searchText: some(text)
    });
    this.updateDebouncedSearchText(text);
  };

  private updateDebouncedSearchText = debounce((text: string) => {
    this.setState(
      {
        debouncedSearchText: some(text)
      },
      () => {
        this.props.dispatchSearchText(this.state.debouncedSearchText);
      }
    );
  }, 300);

  private onSearchDisable = () => {
    this.setState({
      searchText: none,
      debouncedSearchText: none
    });
    this.props.dispatchDisableSearch();
  };
}

const mapDispatchToProps = (dispatch: Dispatch, props: OwnProps) => ({
  dispatchSearchText: (searchText: Option<string>) =>
    dispatch(updateSearchText(searchText)),
  dispatchDisableSearch: () => dispatch(disableSearch()),
  dispatchSearchEnabled: (isSearchEnabled: boolean) => {
    const searchType = props.searchType;
    switch (searchType) {
      case "Messages":
        dispatch(searchMessagesEnabled(isSearchEnabled));
        break;
      case "Services":
        dispatch(searchServicesEnabled(isSearchEnabled));
        break;
    }
  }
});

export default connect(null, mapDispatchToProps)(SearchButton);
