import { fromLeft, TaskEither, tryCatch } from "fp-ts/lib/TaskEither";
import RNLocation, { Location } from "react-native-location";

export const getCurrentLocation = (): TaskEither<Error, Location | null> => {
  const hasPermissions = tryCatch(
    () =>
      RNLocation.requestPermission({
        ios: "whenInUse",
        android: {
          detail: "fine"
        }
      }),
    errorMsg => new Error(String(errorMsg))
  );

  const getLocation = tryCatch(
    () => RNLocation.getLatestLocation({ timeout: 60000 }),
    errorMsg => new Error(String(errorMsg))
  );

  return hasPermissions.chain(hasP => {
    if (hasP) {
      return getLocation;
    }
    return fromLeft<Error, Location | null>(Error("some error occurred"));
  });
};
