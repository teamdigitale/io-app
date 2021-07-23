import { Content, Text, View } from "native-base";
import { ComponentProps } from "react";
import * as React from "react";
import { Image, StyleSheet, SafeAreaView } from "react-native";
import { widthPercentageToDP } from "react-native-responsive-screen";
import { fromNullable, Option } from "fp-ts/lib/Option";
import { index } from "fp-ts/lib/Array";
import { BonusAvailable } from "../../../../../definitions/content/BonusAvailable";
import { BonusAvailableContent } from "../../../../../definitions/content/BonusAvailableContent";
import { IOStyles } from "../../../../components/core/variables/IOStyles";
import { withLightModalContext } from "../../../../components/helpers/withLightModalContext";
import { withLoadingSpinner } from "../../../../components/helpers/withLoadingSpinner";
import ItemSeparatorComponent from "../../../../components/ItemSeparatorComponent";
import BaseScreenComponent from "../../../../components/screens/BaseScreenComponent";
import { EdgeBorderComponent } from "../../../../components/screens/EdgeBorderComponent";
import FooterWithButtons from "../../../../components/ui/FooterWithButtons";
import { LightModalContextInterface } from "../../../../components/ui/LightModal";
import Markdown from "../../../../components/ui/Markdown";
import I18n from "../../../../i18n";
import customVariables from "../../../../theme/variables";
import { useScreenReaderEnabled } from "../../../../utils/accessibility";
import { maybeNotNullyString } from "../../../../utils/strings";
import ButtonDefaultOpacity from "../../../../components/ButtonDefaultOpacity";
import TosBonusComponent from "../../bonusVacanze/components/TosBonusComponent";
import TouchableDefaultOpacity from "../../../../components/TouchableDefaultOpacity";
import { getRemoteLocale } from "../../../../utils/messages";
import { Link } from "../../../../components/core/typography/Link";

type OwnProps = {
  onBack?: () => void;
  bonus: BonusAvailable;
  onConfirm?: () => void;
  onCancel?: () => void;
  primaryCtaText: string;
};

type Props = OwnProps &
  LightModalContextInterface &
  Pick<
    ComponentProps<typeof BaseScreenComponent>,
    "contextualHelp" | "contextualHelpMarkdown" | "faqCategories"
  >;

const CSS_STYLE = `
body {
  font-size: ${customVariables.fontSize1}px;
  color: ${customVariables.brandDarkestGray}
}

h4 {
  font-size: ${customVariables.fontSize2}px;
}
`;
const coverImageWidth = Math.min(48, widthPercentageToDP("30%"));
const styles = StyleSheet.create({
  noPadded: {
    paddingLeft: 0,
    paddingRight: 0
  },
  mainContent: {
    flex: 1
  },
  flexEnd: {
    alignSelf: "flex-start"
  },
  flexStart: {
    width: widthPercentageToDP("70%"),
    alignSelf: "center"
  },
  cover: {
    resizeMode: "contain",
    width: coverImageWidth,
    height: coverImageWidth
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  orgName: {
    fontSize: 18,
    lineHeight: customVariables.lineHeight2
  },
  title: {
    fontSize: customVariables.fontSize3,
    lineHeight: customVariables.lineHeightH3,
    color: customVariables.colorBlack
  },
  urlButton: { flex: 1, textAlign: "center" }
});

const loadingOpacity = 0.9;
// for long content markdown computed height should be not enough
const extraMarkdownBodyHeight = 20;

// TODO get the tos footer from props
const getTosFooter = (
  maybeBonusTos: Option<string>,
  maybeRegulationUrl: Option<{ url: string; name: string }>,
  handleModalPress: (tos: string) => void,
  ctaText: string
) =>
  maybeBonusTos.fold(null, bT =>
    maybeRegulationUrl.fold(
      // if tos is defined and the regolation url is not defined
      // return the link (BONUS VACANZE)
      <>
        <View spacer={true} extralarge={true} />
        <ItemSeparatorComponent noPadded={true} />
        <View spacer={true} extralarge={true} />
        <Text dark={true}>{I18n.t("bonus.bonusVacanze.advice")}</Text>
        <TouchableDefaultOpacity>
          <Link
            weight={"SemiBold"}
            numberOfLines={1}
            onPress={() => handleModalPress(bT)}
          >
            {I18n.t("bonus.tos.title")}
          </Link>
        </TouchableDefaultOpacity>
      </>,
      // if tos and regulation url is defined
      // return a markdown footer including both links reference (BPD)
      rU => (
        <>
          <View spacer={true} extralarge={true} />
          <ItemSeparatorComponent noPadded={true} />
          <View spacer={true} extralarge={true} />
          <Markdown
            cssStyle={CSS_STYLE}
            extraBodyHeight={extraMarkdownBodyHeight}
          >
            {I18n.t("bonus.termsAndConditionFooter", {
              ctaText,
              regulationLink: rU.url,
              tosUrl: bT
            })}
          </Markdown>
        </>
      )
    )
  );

/**
 * A screen to explain how the bonus activation works and how it will be assigned
 */
const BonusInformationComponent: React.FunctionComponent<Props> = props => {
  const [isMarkdownLoaded, setMarkdownLoaded] = React.useState(false);
  const isScreenReaderEnabled = useScreenReaderEnabled();

  const bonusType = props.bonus;
  const bonusTypeLocalizedContent: BonusAvailableContent =
    bonusType[getRemoteLocale()];

  const cancelButtonProps = {
    block: true,
    light: true,
    bordered: true,
    onPress: props.onCancel,
    title: I18n.t("global.buttons.cancel")
  };
  const requestButtonProps = {
    block: true,
    primary: true,
    onPress: props.onConfirm,
    title: props.primaryCtaText
  };

  const onMarkdownLoaded = () => {
    setMarkdownLoaded(true);
  };

  const handleModalPress = (tos: string) =>
    props.showModal(
      <TosBonusComponent tos_url={tos} onClose={props.hideModal} />
    );

  // bonus rules url should be the first one in the urls list
  const maybeRegulationUrl = fromNullable(
    bonusTypeLocalizedContent.urls
  ).chain(urls => index(0, [...urls]));

  // render a stack of button each one representing a url
  const renderUrls = () => {
    const urls = bonusTypeLocalizedContent.urls;
    if (urls === undefined || urls.length === 0) {
      return null;
    }
    const buttons = urls.map((url, idx) => (
      <>
        <ButtonDefaultOpacity
          bordered={true}
          key={`${idx}_${url.url}`}
          onPress={() => handleModalPress(url.url)}
        >
          <Text style={styles.urlButton}>{url.name}</Text>
        </ButtonDefaultOpacity>
        {idx !== urls.length - 1 && <View spacer={true} small={true} />}
      </>
    ));
    return <>{buttons}</>;
  };
  const maybeBonusTos = maybeNotNullyString(bonusTypeLocalizedContent.tos_url);

  const maybeCover = maybeNotNullyString(bonusType.cover);
  const maybeSponsorshipDescription = maybeNotNullyString(
    bonusType.sponsorship_description
  );
  const footerComponent = props.onConfirm ? (
    <FooterWithButtons
      type="TwoButtonsInlineThird"
      leftButton={cancelButtonProps}
      rightButton={requestButtonProps}
    />
  ) : (
    <FooterWithButtons type="SingleButton" leftButton={cancelButtonProps} />
  );
  const ContainerComponent = withLoadingSpinner(() => (
    <BaseScreenComponent
      goBack={props.onBack ?? true}
      headerTitle={bonusTypeLocalizedContent.name}
      contextualHelpMarkdown={props.contextualHelpMarkdown}
      contextualHelp={props.contextualHelp}
      faqCategories={props.faqCategories}
    >
      <SafeAreaView style={IOStyles.flex}>
        {isScreenReaderEnabled && isMarkdownLoaded && footerComponent}
        <Content>
          <View style={styles.row}>
            <View style={styles.flexStart}>
              {maybeSponsorshipDescription.isSome() && (
                <Text dark={true} style={styles.orgName} semibold={true}>
                  {maybeSponsorshipDescription.value}
                </Text>
              )}

              <Text bold={true} dark={true} style={styles.title}>
                {bonusTypeLocalizedContent.title}
              </Text>
            </View>
            <View style={styles.flexEnd}>
              {maybeCover.isSome() && (
                <Image
                  source={{ uri: maybeCover.value }}
                  style={styles.cover}
                />
              )}
            </View>
          </View>
          <View spacer={true} large={true} />
          <Text dark={true}>{bonusTypeLocalizedContent.subtitle}</Text>

          <View spacer={true} />
          <ItemSeparatorComponent noPadded={true} />
          <Markdown
            cssStyle={CSS_STYLE}
            extraBodyHeight={extraMarkdownBodyHeight}
            onLoadEnd={onMarkdownLoaded}
          >
            {bonusTypeLocalizedContent.content}
          </Markdown>
          <View spacer={true} extralarge={true} />
          {isMarkdownLoaded && renderUrls()}
          {getTosFooter(
            maybeBonusTos,
            maybeRegulationUrl,
            handleModalPress,
            props.primaryCtaText
          )}
          {isMarkdownLoaded && <EdgeBorderComponent />}
        </Content>
        {!isScreenReaderEnabled && isMarkdownLoaded && footerComponent}
      </SafeAreaView>
    </BaseScreenComponent>
  ));
  return (
    <ContainerComponent
      isLoading={!isMarkdownLoaded}
      loadingOpacity={loadingOpacity}
    />
  );
};

export default withLightModalContext(BonusInformationComponent);
