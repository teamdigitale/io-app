import { Text } from "native-base";
import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import image from "../../../../../../../img/servicesStatus/error-detail-icon.png";
import { Link } from "../../../../../../components/core/typography/Link";
import { openLink } from "../../../../../../components/ui/Markdown/handlers/link";
import I18n from "../../../../../../i18n";
import { cancelBonusVacanzeRequest } from "../../../store/actions/bonusVacanze";
import { BaseIseeErrorComponent } from "./BaseIseeErrorComponent";

type Props = ReturnType<typeof mapDispatchToProps>;

const dsuUrl = "https://servizi2.inps.it/servizi/Iseeriforma/FrmSimHome.aspx";

const renderBody = (first: string, second: string, third: string) => (
  <Text>
    {first}
    <Link onPress={() => openLink(dsuUrl)}>{second}</Link>
    {third}
  </Text>
);

/**
 * This screen display some additional information when the ISEE is not available for the user.
 * It provides three CTA:
 * - goToDsu: goto INPS website to submit a new DSU
 * - goToSimulation: goto INPS website to do a simulation
 * - cancelRequest: abort the request
 * The screen is tied to the business logic and is composed using {@link MarkdownBaseScreen} and {@link FooterTwoButtons}
 * @param props
 * @constructor
 */

const IseeNotAvailableScreen: React.FunctionComponent<Props> = props => {
  const title = I18n.t("bonus.bonusVacanze.eligibility.iseeNotAvailable.title");
  const first = I18n.t(
    "bonus.bonusVacanze.eligibility.iseeNotAvailable.text.first"
  );
  const second = I18n.t(
    "bonus.bonusVacanze.eligibility.iseeNotAvailable.text.secondo"
  );
  const third = I18n.t(
    "bonus.bonusVacanze.eligibility.iseeNotAvailable.text.third"
  );
  const cta = I18n.t("bonus.bonusVacanze.eligibility.iseeNotAvailable.goToDSU");

  return (
    <BaseIseeErrorComponent
      image={image}
      title={title}
      body={renderBody(first, second, third)}
      ctaText={cta}
      onCancel={props.onCancel}
    />
  );
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  onCancel: () => dispatch(cancelBonusVacanzeRequest())
});

export default connect(null, mapDispatchToProps)(IseeNotAvailableScreen);
