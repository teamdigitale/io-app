import * as pot from "italia-ts-commons/lib/pot";
import { Button, Content, Text, View } from "native-base";
import * as React from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { NavigationScreenProps } from "react-navigation";
import { connect } from "react-redux";

import { ServiceId } from "../../../definitions/backend/ServiceId";
import { ServicePublic } from "../../../definitions/backend/ServicePublic";
import MessageDetailComponent from "../../components/messages/MessageDetailComponent";
import BaseScreenComponent from "../../components/screens/BaseScreenComponent";
import I18n from "../../i18n";
import { contentServiceLoad } from "../../store/actions/content";
import {
  loadMessageWithRelationsAction,
  setMessageReadState
} from "../../store/actions/messages";
import { navigateToServiceDetailsScreen } from "../../store/actions/navigation";
import { Dispatch, ReduxProps } from "../../store/actions/types";
import { messageByIdSelector } from "../../store/reducers/entities/messages/messagesById";
import { makeMessageUIStatesByIdSelector } from "../../store/reducers/entities/messages/messagesUIStatesById";
import { serviceByIdSelector } from "../../store/reducers/entities/services/servicesById";
import { GlobalState } from "../../store/reducers/types";
import { MessageWithContentPO } from "../../types/MessageWithContentPO";
import { InferNavigationParams } from "../../types/react";
import ServiceDetailsScreen from "../preferences/ServiceDetailsScreen";

type MessageDetailScreenNavigationParams = {
  messageId: string;
};

type OwnProps = NavigationScreenProps<MessageDetailScreenNavigationParams>;

type ReduxMappedDispatchProps = Readonly<{
  contentServiceLoad: (serviceId: ServiceId) => void;
  loadMessageWithRelations: () => void;
  setMessageReadState: (isRead: boolean) => void;
  navigateToServiceDetailsScreen: (
    params: InferNavigationParams<typeof ServiceDetailsScreen>
  ) => void;
}>;

type Props = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReduxMappedDispatchProps &
  ReduxProps;

const styles = StyleSheet.create({
  notFullStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  notFullStateMessageText: {
    marginBottom: 10
  }
});

export class MessageDetailScreen extends React.PureComponent<Props, never> {
  private goBack = () => this.props.navigation.goBack();

  private onServiceLinkPressHandler = (service: ServicePublic) => {
    // When a service gets selected, before navigating to the service detail
    // screen, we issue a contentServiceLoad to refresh the service metadata
    this.props.contentServiceLoad(service.service_id);
    this.props.navigateToServiceDetailsScreen({
      service
    });
  };

  /**
   * Renders the empty message state, when no message content is avaialable
   */
  private renderEmptyState = () => {
    return (
      <View style={styles.notFullStateContainer}>
        <Text style={styles.notFullStateMessageText}>
          {I18n.t("messageDetails.emptyMessage")}
        </Text>
      </View>
    );
  };

  /**
   * Used when the App is trying to load the message/service.
   */
  private renderLoadingState = () => {
    return (
      <View style={styles.notFullStateContainer}>
        <Text style={styles.notFullStateMessageText}>
          {I18n.t("messageDetails.loadingText")}
        </Text>
        <ActivityIndicator />
      </View>
    );
  };

  /**
   * Used when something went wrong but there is a way to recover.
   * (ex. the loading of the message/service failed but we can retry)
   */
  private renderErrorState = () => {
    return (
      <View style={styles.notFullStateContainer}>
        <Text style={styles.notFullStateMessageText}>
          {I18n.t("messageDetails.errorText")}
        </Text>
        <Button primary={true} onPress={this.props.loadMessageWithRelations}>
          <Text>{I18n.t("messageDetails.retryText")}</Text>
        </Button>
      </View>
    );
  };

  /**
   * Used when we have all data to properly render the content of the screen.
   */
  private renderFullState = (
    message: MessageWithContentPO,
    service: pot.Pot<ServicePublic, Error>,
    paymentByRptId: Props["paymentByRptId"]
  ) => {
    return (
      <Content noPadded={true}>
        <MessageDetailComponent
          message={message}
          paymentByRptId={paymentByRptId}
          service={service}
          onServiceLinkPress={
            pot.isSome(service)
              ? () => this.onServiceLinkPressHandler(service.value)
              : undefined
          }
        />
      </Content>
    );
  };

  // TODO: Add a Provider and an HOC to manage multiple render states in a simpler way.
  private renderCurrentState = () => {
    const { potMessage, potService, paymentByRptId } = this.props;

    if (pot.isSome(potMessage)) {
      return this.renderFullState(potMessage.value, potService, paymentByRptId);
    }
    if (pot.isLoading(potMessage)) {
      return this.renderLoadingState();
    }
    if (pot.isError(potMessage)) {
      return this.renderErrorState();
    }

    // Fallback to invalid state
    return this.renderEmptyState();
  };

  private setMessageReadState = () => {
    const { potMessage, messageUIStates } = this.props;

    if (pot.isSome(potMessage) && !messageUIStates.read) {
      // Set the message read state to TRUE
      this.props.setMessageReadState(true);
    }
  };

  public componentDidMount() {
    this.setMessageReadState();
  }

  public componentDidUpdate() {
    this.setMessageReadState();
  }

  public render() {
    return (
      <BaseScreenComponent
        headerTitle={I18n.t("messageDetails.headerTitle")}
        goBack={this.goBack}
      >
        {this.renderCurrentState()}
      </BaseScreenComponent>
    );
  }
}

const mapStateToProps = (state: GlobalState, ownProps: OwnProps) => {
  const messageId = ownProps.navigation.getParam("messageId");

  const maybePotMessage = messageByIdSelector(messageId)(state);

  // In case maybePotMessage is undefined we fallback to an empty message.
  // This mens we navigated to the message screen with a non-existing message
  // ID (should never happen!).
  const potMessage = maybePotMessage !== undefined ? maybePotMessage : pot.none;

  // Map the potential message to the potential service
  const potService = pot
    .toOption(potMessage)
    .mapNullable(message =>
      serviceByIdSelector(message.sender_service_id)(state)
    )
    .getOrElse(pot.none);

  const messageUIStates = makeMessageUIStatesByIdSelector(messageId)(state);

  return {
    potMessage,
    messageUIStates,
    potService,
    paymentByRptId: state.entities.paymentByRptId
  };
};

const mapDispatchToProps = (
  dispatch: Dispatch,
  ownProps: OwnProps
): ReduxMappedDispatchProps => {
  const messageId = ownProps.navigation.getParam("messageId");
  return {
    contentServiceLoad: (serviceId: ServiceId) =>
      dispatch(contentServiceLoad.request(serviceId)),
    loadMessageWithRelations: () =>
      dispatch(loadMessageWithRelationsAction(messageId)),
    setMessageReadState: (isRead: boolean) =>
      dispatch(setMessageReadState(messageId, isRead)),
    navigateToServiceDetailsScreen: (
      params: InferNavigationParams<typeof ServiceDetailsScreen>
    ) => dispatch(navigateToServiceDetailsScreen(params))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MessageDetailScreen);
