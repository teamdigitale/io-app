import { fromNullable, none, Option, some } from "fp-ts/lib/Option";
import I18n from "i18n-js";
import * as pot from "italia-ts-commons/lib/pot";
import { Text, View } from "native-base";
import * as React from "react";
import { StyleSheet } from "react-native";
import { CreatedMessageWithContent } from "../../../definitions/backend/CreatedMessageWithContent";
import { ServicePublic } from "../../../definitions/backend/ServicePublic";
import { Service } from "../../../definitions/content/Service";
import { ServiceMetadataState } from "../../store/reducers/content";
import { PaymentByRptIdState } from "../../store/reducers/entities/payments";
import customVariables from "../../theme/variables";
import { format, formatDateAsLocal } from "../../utils/dates";
import CopyButtonComponent from "../CopyButtonComponent";
import { Link } from "../core/typography/Link";
import EmailCallCTA from "../screens/EmailCallCTA";

const styles = StyleSheet.create({
  container: {
    backgroundColor: customVariables.brandGray,
    padding: customVariables.contentPadding
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  flex: {
    flex: 1,
    alignSelf: "center"
  },
  service: {
    display: "flex",
    flexDirection: "row"
  }
});

type Props = Readonly<{
  message: CreatedMessageWithContent;
  serviceDetail: pot.Pot<ServicePublic, Error>;
  serviceMetadata?: ServiceMetadataState;
  paymentsByRptId?: PaymentByRptIdState;
  goToServiceDetail?: () => void;
}>;

type MessageData = {
  service_detail: Option<ServicePublic>;
  organization_name: Option<string>;
  service_name: Option<string>;
  metadata: Option<Service>;
};

/**
 * A component to render a summary of data about the message and the related service.
 * If data are available, the user can start a call or send and email to the service
 */
class MessageDetailData extends React.PureComponent<Props> {
  private date = formatDateAsLocal(this.props.message.created_at);
  private time = format(this.props.message.created_at, "HH.mm");

  get data(): MessageData {
    const serviceDetail = pot.toOption(this.props.serviceDetail);
    const metadata =
      this.props.serviceMetadata === undefined
        ? none
        : pot.toOption(this.props.serviceMetadata);
    return {
      service_detail: serviceDetail,
      organization_name: serviceDetail.map(s => s.organization_name),
      service_name: serviceDetail.map(s => s.service_name),
      metadata: metadata.fold(none, m =>
        fromNullable(m).fold(none, mm => some(mm))
      )
    };
  }

  get hasEmailOrPhone(): boolean {
    return this.data.metadata.fold(
      false,
      m => m.phone !== undefined || m.email !== undefined
    );
  }

  private renderButtons = () => {
    if (!this.hasEmailOrPhone) {
      return undefined;
    }
    const phone = this.data.metadata.fold(undefined, m => m.phone);
    const email = this.data.metadata.fold(undefined, m => m.email);

    return <EmailCallCTA phone={phone} email={email} />;
  };

  public render() {
    const textToCopy: string = pot
      .toOption(this.props.serviceDetail)
      .map(({ service_name }) => `${service_name} - ${this.props.message.id}`)
      .getOrElse(this.props.message.id);

    return (
      <View style={styles.container}>
        <Text>
          {I18n.t("messageDetails.dateSending")}
          <Text bold={true}>{` ${this.date} - ${this.time}`}</Text>
        </Text>

        {this.data.organization_name.isSome() && (
          <Text>
            {I18n.t("messageDetails.sender")}
            <Text bold={true}>{` ${this.data.organization_name.value}`}</Text>
          </Text>
        )}

        {this.data.service_name.isSome() && this.data.service_detail.isSome() && (
          <View style={styles.service}>
            <Text>{`${I18n.t("messageDetails.service")} `}</Text>
            <Link weight={"Bold"} onPress={this.props.goToServiceDetail}>
              {this.data.service_detail.value.service_name}
            </Link>
          </View>
        )}
        {this.hasEmailOrPhone && (
          <React.Fragment>
            <View spacer={true} />

            <Text bold={true}>{I18n.t("messageDetails.question")}</Text>
            <View spacer={true} xsmall={true} />
            <Text>{I18n.t("messageDetails.answer")}</Text>

            <View spacer={true} />

            <React.Fragment>
              <View style={styles.row}>
                <Text style={styles.flex}>{`${I18n.t("messageDetails.id")} ${
                  this.props.message.id
                }`}</Text>
                <CopyButtonComponent textToCopy={textToCopy} />
              </View>
              <View spacer={true} />
            </React.Fragment>
            {this.renderButtons()}
            <View spacer={true} small={true} />
          </React.Fragment>
        )}
      </View>
    );
  }
}

export default MessageDetailData;
