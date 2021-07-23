import { fromNullable, none, Option } from "fp-ts/lib/Option";
import * as pot from "italia-ts-commons/lib/pot";
import { Millisecond } from "italia-ts-commons/lib/units";
import { Badge, Text, Toast, View } from "native-base";
import * as React from "react";
import {
  Animated,
  Easing,
  SafeAreaView,
  StyleSheet,
  ViewStyle
} from "react-native";
import ViewShot, { CaptureOptions } from "react-native-view-shot";
import { NavigationInjectedProps } from "react-navigation";
import { connect } from "react-redux";
import { BonusActivationStatusEnum } from "../../../../../definitions/bonus_vacanze/BonusActivationStatus";
import { BonusActivationWithQrCode } from "../../../../../definitions/bonus_vacanze/BonusActivationWithQrCode";
import { withLightModalContext } from "../../../../components/helpers/withLightModalContext";
import ItemSeparatorComponent from "../../../../components/ItemSeparatorComponent";
import { ContextualHelpPropsMarkdown } from "../../../../components/screens/BaseScreenComponent";
import DarkLayout from "../../../../components/screens/DarkLayout";
import { EdgeBorderComponent } from "../../../../components/screens/EdgeBorderComponent";
import GenericErrorComponent from "../../../../components/screens/GenericErrorComponent";
import TouchableDefaultOpacity from "../../../../components/TouchableDefaultOpacity";
import IconFont from "../../../../components/ui/IconFont";
import { LightModalContextInterface } from "../../../../components/ui/LightModal";
import I18n from "../../../../i18n";
import { navigateBack } from "../../../../store/actions/navigation";
import { Dispatch } from "../../../../store/actions/types";
import { GlobalState } from "../../../../store/reducers/types";
import variables from "../../../../theme/variables";
import { formatDateAsLocal } from "../../../../utils/dates";
import {
  isShareEnabled,
  saveImageToGallery,
  share
} from "../../../../utils/share";
import { showToast } from "../../../../utils/showToast";
import { maybeNotNullyString } from "../../../../utils/strings";
import BonusCardComponent from "../components/BonusCardComponent";
import { BonusCompositionDetails } from "../components/keyValueTable/BonusCompositionDetails";
import { FamilyComposition } from "../components/keyValueTable/FamilyComposition";
import QrModalBox from "../components/QrModalBox";
import TosBonusComponent from "../components/TosBonusComponent";
import {
  cancelLoadBonusFromIdPolling,
  startLoadBonusFromIdPolling
} from "../store/actions/bonusVacanze";
import {
  bonusActiveDetailByIdSelector,
  ownedActiveOrRedeemedBonus
} from "../store/reducers/allActive";
import {
  availableBonusTypesSelectorFromId,
  bonusVacanzeLogo
} from "../store/reducers/availableBonusesTypes";
import {
  getBonusCodeFormatted,
  ID_BONUS_VACANZE_TYPE,
  isBonusActive,
  validityInterval
} from "../utils/bonus";
import { Label } from "../../../../components/core/typography/Label";
import { IOColors } from "../../../../components/core/variables/IOColors";
import { useIOBottomSheet } from "../../../../utils/bottomSheet";
import { getRemoteLocale } from "../../../../utils/messages";
import { Link } from "../../../../components/core/typography/Link";
import { ActivateBonusDiscrepancies } from "./activation/request/ActivateBonusDiscrepancies";

type QRCodeContents = {
  [key: string]: string;
};

type NavigationParams = Readonly<{
  bonus: BonusActivationWithQrCode;
  validFrom?: Date;
  validTo?: Date;
}>;

const QR_CODE_MIME_TYPE = "image/svg+xml";
const PNG_IMAGE_TYPE = "image/png";

type OwnProps = NavigationInjectedProps<NavigationParams>;

type Props = OwnProps &
  ReturnType<typeof mapDispatchToProps> &
  ReturnType<typeof mapStateToProps> &
  LightModalContextInterface;

const styles = StyleSheet.create({
  emptyHeader: { height: 90 },
  flex: {
    flex: 1
  },
  imagePrintable: {
    position: "relative",
    top: 28
  },
  image: {
    position: "absolute",
    top: -144,
    height: 168,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3
    },
    shadowOpacity: 0.29,
    shadowRadius: 4.65,
    zIndex: 7,
    elevation: 7,
    alignSelf: "center",
    justifyContent: "center",
    maxWidth: 327
  },
  center: {
    alignSelf: "center"
  },
  validUntil: {
    color: variables.brandDarkestGray,
    lineHeight: variables.lineHeightSmall,
    paddingVertical: 8
  },
  rowBlock: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  itemsCenter: {
    alignItems: "center"
  },
  paddedIconLeft: {
    paddingLeft: 12
  },
  paddedContentLeft: {
    paddingLeft: variables.contentPadding
  },
  paddedContentRight: {
    paddingRight: variables.contentPadding
  },
  statusBadgeActive: {
    height: 18,
    marginTop: 2,
    backgroundColor: variables.contentPrimaryBackground
  },
  statusBadgeRevoked: {
    height: 18,
    marginTop: 2,
    backgroundColor: variables.brandHighLighter
  },
  screenshotTime: {
    textAlign: "center",
    color: variables.brandPrimary,
    fontSize: variables.fontSizeBase + 2
  },
  statusText: {
    fontSize: 12,
    lineHeight: 18
  },
  colorDarkest: {
    color: variables.brandDarkestGray
  },
  colorGrey: {
    color: variables.textColor
  },
  sectionLabel: {
    fontSize: variables.fontSize1,
    lineHeight: 21
  },
  viewShot: {
    flex: 1,
    backgroundColor: "white"
  },
  commonLabel: {
    lineHeight: 18
  },
  footerButton: { flex: 1, alignItems: "center" },
  footerButtonIcon: { color: IOColors.blue, marginBottom: 6, fontSize: 24 },
  hover: {
    minWidth: "100%",
    minHeight: "100%",
    bottom: 0,
    left: 0,
    top: 0,
    position: "absolute",
    alignItems: "center",
    justifyContent: "center"
  },
  headerSpacer: { height: 154 }
});

async function readBase64Svg(bonusWithQrCode: BonusActivationWithQrCode) {
  return new Promise<QRCodeContents>((res, _) => {
    const qrCodes: BonusActivationWithQrCode["qr_code"] = [
      ...bonusWithQrCode.qr_code
    ];
    const content = qrCodes.reduce<QRCodeContents>(
      (acc: QRCodeContents, curr: BonusActivationWithQrCode["qr_code"][0]) => {
        // for svg we need to convert base64 content to ascii to be rendered
        if (curr.mime_type === QR_CODE_MIME_TYPE) {
          return {
            ...acc,
            [curr.mime_type]: Buffer.from(curr.content, "base64").toString(
              "ascii"
            )
          };
        } else {
          return {
            ...acc,
            [curr.mime_type]: curr.content
          };
        }
      },
      {}
    );
    res(content);
  });
}

const contextualHelpMarkdown: ContextualHelpPropsMarkdown = {
  title: "bonus.bonusVacanze.detail.contextualHelp.title",
  body: "bonus.bonusVacanze.detail.contextualHelp.body"
};

const shareQR = async (content: string, code: string) => {
  const shared = await share(`data:image/png;base64,${content}`, code).run();
  shared.mapLeft(_ => showToastGenericError());
};
const showToastGenericError = () => showToast(I18n.t("global.genericError"));
const startRefreshPollingAfter = 3000 as Millisecond;

// screenshot option and state
const flashAnimation = 100 as Millisecond;
const screenShotOption: CaptureOptions = { format: "jpg", quality: 0.9 };
type ScreenShotState = {
  isPrintable: boolean;
  imageStyle?: ViewStyle;
  screenShotUri?: string;
};
const screenShortInitialState: ScreenShotState = {
  imageStyle: undefined,
  isPrintable: false,
  screenShotUri: undefined
};

type FooterButtonProp = {
  label: string;
  iconName: string;
  onPress: () => void;
};

type FooterProps = {
  firstButton?: FooterButtonProp;
  secondButton?: FooterButtonProp;
  thirdButton?: FooterButtonProp;
};

// icon + text in column
const FooterButton: React.FunctionComponent<FooterButtonProp> = (
  props: FooterButtonProp
) => (
  <TouchableDefaultOpacity onPress={props.onPress} style={styles.footerButton}>
    <IconFont name={props.iconName} style={styles.footerButtonIcon} />
    <Label weight={"Regular"}>{props.label}</Label>
  </TouchableDefaultOpacity>
);
// 3 buttons in a row
const ActiveBonusFooterButtons: React.FunctionComponent<FooterProps> = (
  props: FooterProps
) => (
  <View style={styles.rowBlock}>
    {props.firstButton && <FooterButton {...props.firstButton} />}
    {props.secondButton && <FooterButton {...props.secondButton} />}
    {props.thirdButton && <FooterButton {...props.thirdButton} />}
  </View>
);

// eslint-disable-next-line sonarjs/cognitive-complexity
const ActiveBonusScreen: React.FunctionComponent<Props> = (props: Props) => {
  const bonusFromNav = props.navigation.getParam("bonus");
  const bonus = pot.getOrElse(props.bonus, bonusFromNav);
  const screenShotRef = React.createRef<ViewShot>();
  const [qrCode, setQRCode] = React.useState<QRCodeContents>({});
  const [screenShotState, setScreenShotState] = React.useState<ScreenShotState>(
    screenShortInitialState
  );
  const backgroundAnimation = React.useRef(new Animated.Value(0)).current;
  const backgroundInterpolation = backgroundAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0)", "rgba(255,255,255,1)"]
  });

  React.useEffect(() => {
    // start refresh polling after startRefreshPollingAfter
    const delayedPolling = setTimeout(() => {
      // When mounting the component starts a polling to update the bonus information at runtime
      props.startPollingBonusFromId(bonusFromNav.id);
    }, startRefreshPollingAfter);

    if (bonus) {
      readBase64Svg(bonus)
        .then(cc => setQRCode(cc))
        .catch(_ => undefined);
    }
    return () => {
      // When the component unmounts demands the stop to the polling saga
      props.cancelPollingBonusFromId();
      clearTimeout(delayedPolling);
    };
  }, []);

  React.useEffect(() => {
    if (screenShotState.isPrintable) {
      {
        // start capture screenshot
        captureScreenshot().map(capture => {
          capture()
            .then(screenShotUri => {
              setScreenShotState(prev => ({ ...prev, screenShotUri }));
            })
            .catch(() => {
              showToastGenericError();
              // animate fadeOut of flash light animation
              Animated.timing(backgroundAnimation, {
                duration: flashAnimation,
                toValue: 0,
                useNativeDriver: false,
                easing: Easing.cubic
              }).start();
            });
        });
        return;
      }
    }
  }, [screenShotState.isPrintable]);

  React.useEffect(() => {
    // if the screenShotUri is defined start saving image and restore default style
    // show a toast error if something went wrong
    if (screenShotState.screenShotUri) {
      saveImageToGallery(`file://${screenShotState.screenShotUri}`)
        .run()
        .then(maybeSaved => {
          maybeSaved.fold(showToastGenericError, () => {
            Toast.show({
              text: I18n.t("bonus.bonusVacanze.saveScreenShotOk")
            });
          });
        })
        .catch(showToastGenericError)
        .finally(() => {
          // animate fadeOut of flash light animation
          Animated.timing(backgroundAnimation, {
            duration: flashAnimation,
            toValue: 0,
            useNativeDriver: false,
            easing: Easing.cubic
          }).start();
        });
      setScreenShotState(screenShortInitialState);
    }
  }, [screenShotState.screenShotUri]);

  // translate the bonus status. If no mapping found -> empty string
  const maybeStatusDescription = maybeNotNullyString(
    bonus
      ? I18n.t(`bonus.${bonus.status.toLowerCase()}`, {
          defaultValue: ""
        })
      : ""
  );

  // return an option containing the capture function

  const captureScreenshot = (): Option<() => Promise<string>> =>
    fromNullable(
      screenShotRef && screenShotRef.current && screenShotRef.current.capture
    );

  // call this function to create a screenshot and save it into the device camera roll
  const saveScreenShot = () => {
    if (captureScreenshot().isSome()) {
      // start screen capturing when first flash light animation will be completed (screen becomes white)
      Animated.timing(backgroundAnimation, {
        duration: flashAnimation,
        toValue: 1,
        useNativeDriver: false,
        easing: Easing.cubic
      }).start(() => {
        // change some style properties to avoid some UI element will be cut out of the image (absolute position and negative offsets)
        // the ViewShot renders into a canvas all its children
        setScreenShotState(prevState => ({
          ...prevState,
          imageStyle: styles.imagePrintable,
          isPrintable: true
        }));
      });
    }
  };

  const { present: openModalBox } = useIOBottomSheet(
    <QrModalBox
      codeToDisplay={getBonusCodeFormatted(bonus)}
      codeToCopy={bonus.id}
      qrCode={qrCode[QR_CODE_MIME_TYPE]}
      logo={props.logo}
    />,
    I18n.t("bonus.bonusVacanze.name"),
    466
  );

  const handleShare = () =>
    shareQR(
      qrCode[PNG_IMAGE_TYPE],
      `${I18n.t("bonus.bonusVacanze.shareMessage")} ${getBonusCodeFormatted(
        bonusFromNav
      )}`
    );

  const renderBonusActiveButtons = () => (
    <ActiveBonusFooterButtons
      firstButton={{
        label: I18n.t("bonus.bonusVacanze.cta.qrCode"),
        iconName: "io-qr",
        onPress: openModalBox
      }}
      secondButton={
        /**
         * If the share is not available on the device share button won't be rendered
         */
        isShareEnabled()
          ? {
              label: I18n.t("global.genericShare").toLowerCase(),
              iconName: "io-share",
              onPress: handleShare
            }
          : undefined
      }
      thirdButton={{
        label: I18n.t("global.genericSave").toLowerCase(),
        iconName: "io-save",
        onPress: saveScreenShot
      }}
    />
  );

  const renderFooterButtons = () =>
    bonus && isBonusActive(bonus) && renderBonusActiveButtons();

  const renderInformationBlock = (
    icon: string,
    text: string,
    iconColor?: string
  ) => {
    const now = new Date();
    return (
      <>
        {/* show the time when the screenshot is captured */}
        {screenShotState.isPrintable && (
          <Text style={styles.screenshotTime} bold={true}>
            {`${I18n.t("bonus.bonusVacanze.savedOn")}${formatDateAsLocal(
              now,
              true,
              true
            )} - ${now.toLocaleTimeString()}`}
          </Text>
        )}
        <View
          style={[
            styles.rowBlock,
            styles.itemsCenter,
            { justifyContent: "center" }
          ]}
        >
          <IconFont
            name={icon}
            color={fromNullable(iconColor).getOrElse(variables.textColor)}
            size={variables.fontSize3}
            style={styles.paddedIconLeft}
          />
          <View hspacer={true} />
          <Text style={[styles.flex, styles.validUntil]} bold={true}>
            {text}
          </Text>
        </View>
      </>
    );
  };

  const switchInformationText = () => {
    switch (bonus.status) {
      case BonusActivationStatusEnum.ACTIVE:
        return renderInformationBlock(
          "io-calendario",
          I18n.t("bonus.bonusVacanze.statusInfo.validBetween", {
            from: bonusValidityInterval.fold("n/a", v => v.e1),
            to: bonusValidityInterval.fold("n/a", v => v.e2)
          })
        );
      case BonusActivationStatusEnum.REDEEMED:
        return renderInformationBlock(
          "io-complete",
          I18n.t("bonus.bonusVacanze.statusInfo.redeemed", {
            date: formatDateAsLocal(
              fromNullable(bonus.redeemed_at).getOrElse(bonus.created_at),
              true
            )
          }),
          variables.brandSuccess
        );
      case BonusActivationStatusEnum.FAILED:
        return renderInformationBlock(
          "io-notice",
          I18n.t("bonus.bonusVacanze.statusInfo.bonusRejected")
        );
      default:
        return null;
    }
  };

  const handleModalPress = (tos: string) =>
    props.showModal(
      <TosBonusComponent tos_url={tos} onClose={props.hideModal} />
    );

  const maybeBonusInfo = fromNullable(props.bonusInfo);
  const bonusInfoFromLocale = maybeBonusInfo
    .map(b => b[getRemoteLocale()])
    .toUndefined();
  const maybeBonusTos = fromNullable(bonusInfoFromLocale).fold(none, b =>
    maybeNotNullyString(b.tos_url)
  );

  const from = maybeBonusInfo.map(bi => bi.valid_from);
  const to = maybeBonusInfo.map(bi => bi.valid_to);
  const bonusValidityInterval = validityInterval(
    from.toUndefined(),
    to.toUndefined()
  );
  return !props.isError && bonus ? (
    <>
      <DarkLayout
        bounces={false}
        title={I18n.t("bonus.bonusVacanze.name")}
        contextualHelpMarkdown={contextualHelpMarkdown}
        faqCategories={["bonus_detail"]}
        allowGoBack={true}
        topContent={<View style={styles.headerSpacer} />}
        footerContent={renderFooterButtons()}
        gradientHeader={true}
        hideHeader={true}
      >
        <ViewShot
          ref={screenShotRef}
          style={styles.viewShot}
          options={screenShotOption}
        >
          <SafeAreaView>
            <View>
              <View
                style={[styles.paddedContentLeft, styles.paddedContentRight]}
              >
                <View style={[styles.image, screenShotState.imageStyle]}>
                  <BonusCardComponent
                    bonus={bonus}
                    viewQR={openModalBox}
                    share={handleShare}
                  />
                </View>
                <View spacer={true} extralarge={true} />
                {switchInformationText()}
                <View spacer={true} />
              </View>
              {props.hasMoreOwnedActiveBonus && (
                <ActivateBonusDiscrepancies
                  text={I18n.t("bonus.bonusVacanze.multipleBonus")}
                  attention={I18n.t(
                    "bonus.bonusVacanze.eligibility.activateBonus.discrepancies.attention"
                  )}
                />
              )}
              <View
                style={[styles.paddedContentLeft, styles.paddedContentRight]}
              >
                <ItemSeparatorComponent noPadded={true} />
                <View spacer={true} />
                <BonusCompositionDetails
                  bonusAmount={bonus.dsu_request.max_amount}
                  taxBenefit={bonus.dsu_request.max_tax_benefit}
                />
                <View spacer={true} />
                <ItemSeparatorComponent noPadded={true} />
                <View spacer={true} />
                <FamilyComposition
                  familyMembers={bonus.dsu_request.family_members}
                />
                <View spacer={true} />
                <ItemSeparatorComponent noPadded={true} />
                <View spacer={true} />
                {maybeStatusDescription.isSome() && (
                  <View style={styles.rowBlock}>
                    <Text
                      semibold={true}
                      style={[styles.sectionLabel, styles.colorDarkest]}
                    >
                      {I18n.t("bonus.bonusVacanze.status")}
                    </Text>
                    <Badge
                      style={
                        isBonusActive(bonus)
                          ? styles.statusBadgeActive
                          : styles.statusBadgeRevoked
                      }
                    >
                      <Text
                        style={styles.statusText}
                        semibold={true}
                        dark={!isBonusActive(bonus)}
                      >
                        {maybeStatusDescription.value}
                      </Text>
                    </Badge>
                  </View>
                )}
                <View spacer={true} />
                {!isBonusActive(bonus) && bonus.redeemed_at && (
                  <>
                    <View style={styles.rowBlock}>
                      <Text style={[styles.colorGrey, styles.commonLabel]}>
                        {I18n.t("bonus.bonusVacanze.consumedAt")}
                      </Text>
                      <Text style={[styles.colorGrey, styles.commonLabel]}>
                        {formatDateAsLocal(bonus.redeemed_at, true)}
                      </Text>
                    </View>
                    <View spacer={true} small={true} />
                  </>
                )}
                <View style={styles.rowBlock}>
                  <Text style={[styles.colorGrey, styles.commonLabel]}>
                    {I18n.t("bonus.bonusVacanze.requestedAt")}
                  </Text>
                  <Text style={[styles.colorGrey, styles.commonLabel]}>
                    {formatDateAsLocal(bonus.created_at, true)}
                  </Text>
                </View>
                {!screenShotState.isPrintable && maybeBonusTos.isSome() && (
                  <>
                    <View spacer={true} />
                    <ItemSeparatorComponent noPadded={true} />
                    <View spacer={true} large={true} />
                    <TouchableDefaultOpacity>
                      <Link
                        onPress={() => handleModalPress(maybeBonusTos.value)}
                        numberOfLines={1}
                      >
                        {I18n.t("bonus.tos.title")}
                      </Link>
                    </TouchableDefaultOpacity>
                  </>
                )}
                {/* add extra bottom space when capturing screenshot */}
                {screenShotState.isPrintable && (
                  <>
                    <View spacer={true} />
                    <View spacer={true} />
                  </>
                )}
                {!screenShotState.isPrintable && <EdgeBorderComponent />}
              </View>
            </View>
          </SafeAreaView>
        </ViewShot>
      </DarkLayout>
      {/* top layout animated when screenshot is captured (save button) to simulate flash effect */}
      <Animated.View
        pointerEvents={"none"}
        style={[styles.hover, { backgroundColor: backgroundInterpolation }]}
      />
    </>
  ) : (
    <GenericErrorComponent
      onRetry={() => props.startPollingBonusFromId(bonusFromNav.id)}
      onCancel={props.goBack}
      subText={" "}
    />
  );
};

const mapStateToProps = (state: GlobalState, ownProps: OwnProps) => {
  const bonusFromNav = ownProps.navigation.getParam("bonus");
  const bonus = bonusActiveDetailByIdSelector(bonusFromNav.id)(state);

  return {
    hasMoreOwnedActiveBonus: ownedActiveOrRedeemedBonus(state).length > 1,
    bonusInfo: availableBonusTypesSelectorFromId(ID_BONUS_VACANZE_TYPE)(state),
    bonus,
    isError: pot.isNone(bonus) && pot.isError(bonus), // error and no bonus data, user should retry to load
    logo: bonusVacanzeLogo(state)
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  goBack: () => dispatch(navigateBack()),
  startPollingBonusFromId: (id: string) =>
    dispatch(startLoadBonusFromIdPolling(id)),
  cancelPollingBonusFromId: () => dispatch(cancelLoadBonusFromIdPolling())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withLightModalContext(ActiveBonusScreen));
