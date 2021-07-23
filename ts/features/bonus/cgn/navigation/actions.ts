import { NavigationActions } from "react-navigation";
import { InferNavigationParams } from "../../../../types/react";
import CgnMerchantDetailScreen from "../screens/merchants/CgnMerchantDetailScreen";
import CGN_ROUTES from "./routes";

export const navigateToCgnActivationLoadActivationStatus = () =>
  NavigationActions.navigate({
    routeName: CGN_ROUTES.ACTIVATION.LOAD_CHECK_ACTIVATION_STATUS
  });

export const navigateToCgnActivationInformationTos = () =>
  NavigationActions.navigate({
    routeName: CGN_ROUTES.ACTIVATION.INFORMATION_TOS
  });

export const navigateToCgnActivationLoading = () =>
  NavigationActions.navigate({
    routeName: CGN_ROUTES.ACTIVATION.LOADING
  });

export const navigateToEycaActivationLoading = () =>
  NavigationActions.navigate({
    routeName: CGN_ROUTES.EYCA.ACTIVATION.LOADING
  });

export const navigateToCgnAlreadyActive = () =>
  NavigationActions.navigate({
    routeName: CGN_ROUTES.ACTIVATION.EXISTS
  });

export const navigateToCgnActivationPending = () =>
  NavigationActions.navigate({
    routeName: CGN_ROUTES.ACTIVATION.PENDING
  });

export const navigateToCgnActivationTimeout = () =>
  NavigationActions.navigate({
    routeName: CGN_ROUTES.ACTIVATION.TIMEOUT
  });

export const navigateToCgnActivationIneligible = () =>
  NavigationActions.navigate({
    routeName: CGN_ROUTES.ACTIVATION.INELIGIBLE
  });

export const navigateToCgnActivationCompleted = () =>
  NavigationActions.navigate({
    routeName: CGN_ROUTES.ACTIVATION.COMPLETED
  });

// Details
export const navigateToCgnDetails = () =>
  NavigationActions.navigate({
    routeName: CGN_ROUTES.DETAILS
  });

export const navigateToCgnDetailsOtp = () =>
  NavigationActions.navigate({
    routeName: CGN_ROUTES.DETAILS_OTP
  });

// Merchants
export const navigateToCgnMerchantsList = () =>
  NavigationActions.navigate({
    routeName: CGN_ROUTES.MERCHANTS.LIST
  });

export const navigateToCgnMerchantsTabs = () =>
  NavigationActions.navigate({
    routeName: CGN_ROUTES.MERCHANTS.TABS
  });

export const navigateToCgnMerchantDetail = (
  params: InferNavigationParams<typeof CgnMerchantDetailScreen>
) =>
  NavigationActions.navigate({
    routeName: CGN_ROUTES.MERCHANTS.DETAIL,
    params
  });
