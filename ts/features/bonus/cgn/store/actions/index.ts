import { CgnActivationActions } from "./activation";
import { CgnDetailsActions } from "./details";
import { CgnEycaActivationActions } from "./eyca/activation";
import { CgnEycaStatusActions } from "./eyca/details";
import { CgnMerchantsAction } from "./merchants";
import { CgnOtpActions } from "./otp";
import { CgnGeocodingAction } from "./geocoding";

export type CgnActions =
  | CgnActivationActions
  | CgnDetailsActions
  | CgnEycaActivationActions
  | CgnEycaStatusActions
  | CgnMerchantsAction
  | CgnGeocodingAction
  | CgnOtpActions;
