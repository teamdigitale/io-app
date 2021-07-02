import * as pot from "italia-ts-commons/lib/pot";
import React, { useEffect } from "react";
import { connect } from "react-redux";
import { fromNullable } from "fp-ts/lib/Option";

import { GlobalState } from "../../../store/reducers/types";
import I18n from "../../../i18n";
import ItemSeparatorComponent from "../../ItemSeparatorComponent";
import { NotificationChannelEnum } from "../../../../definitions/backend/NotificationChannel";
import { Dispatch } from "../../../store/actions/types";
import {
  servicePreferenceSelector,
  ServicePreferenceState
} from "../../../store/reducers/entities/services/servicePreference";
import { ServiceId } from "../../../../definitions/backend/ServiceId";
import {
  loadServicePreference,
  upsertServicePreference
} from "../../../store/actions/services/servicePreference";
import { serviceIDCurrentSelector } from "../../../store/reducers/entities/services/currentService";
import {
  isServicePreferenceResponseSuccess,
  ServicePreference
} from "../../../types/services/ServicePreferenceResponse";
import { isStrictSome } from "../../../utils/pot";
import PreferenceToggleRow from "./PreferenceToggleRow";

type Item = "email" | "push" | "inbox";

type Props = {
  channels?: ReadonlyArray<NotificationChannelEnum>;
} & ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>;

const hasChannel = (
  channel: NotificationChannelEnum,
  channels?: ReadonlyArray<NotificationChannelEnum>
) =>
  fromNullable(channels)
    .map(anc => anc.indexOf(channel) !== -1)
    .getOrElse(true);

const ContactPreferencesToggle: React.FC<Props> = (props: Props) => {
  const { isLoading, isError } = props;

  const loadPreferences = () => {
    if (props.currentService !== null) {
      props.loadServicePreference(props.currentService.serviceID);
    }
  };

  useEffect(loadPreferences, []);

  const onValueChange = (value: boolean, type: Item) => {
    if (
      isStrictSome(props.servicePreferenceStatus) &&
      isServicePreferenceResponseSuccess(props.servicePreferenceStatus.value) &&
      props.currentService !== null
    ) {
      switch (type) {
        case "inbox":
          props.upsertServicePreference(props.currentService.serviceID, {
            inbox: value,
            push: value
              ? props.servicePreferenceStatus.value.value.push
              : false,
            email: value
              ? props.servicePreferenceStatus.value.value.email
              : false,
            settings_version:
              props.servicePreferenceStatus.value.value.settings_version
          });
          return;
        case "push":
          props.upsertServicePreference(props.currentService.serviceID, {
            ...props.servicePreferenceStatus.value.value,
            push: value
          });
          return;
        case "email":
          props.upsertServicePreference(props.currentService.serviceID, {
            ...props.servicePreferenceStatus.value.value,
            email: value
          });
          return;
      }
    }
  };

  const getValueOrFalse = (
    potServicePreference: ServicePreferenceState,
    key: Item
  ): boolean => {
    if (
      isStrictSome(potServicePreference) &&
      isServicePreferenceResponseSuccess(potServicePreference.value)
    ) {
      return potServicePreference.value.value[key];
    }
    return false;
  };

  return (
    <>
      <PreferenceToggleRow
        label={
          getValueOrFalse(props.servicePreferenceStatus, "inbox")
            ? I18n.t("services.serviceIsEnabled")
            : I18n.t("services.serviceNotEnabled")
        }
        onPress={(value: boolean) => onValueChange(value, "inbox")}
        isLoading={isLoading}
        isError={isError}
        onReload={loadPreferences}
        value={getValueOrFalse(props.servicePreferenceStatus, "inbox")}
        testID={"contact-preferences-inbox-switch"}
      />
      <ItemSeparatorComponent noPadded />
      {hasChannel(NotificationChannelEnum.WEBHOOK, props.channels) && (
        <>
          <PreferenceToggleRow
            label={I18n.t("services.pushNotifications")}
            onPress={(value: boolean) => onValueChange(value, "push")}
            value={getValueOrFalse(props.servicePreferenceStatus, "push")}
            isLoading={isLoading}
            isError={isError}
            onReload={loadPreferences}
            testID={"contact-preferences-webhook-switch"}
          />
          <ItemSeparatorComponent noPadded />
        </>
      )}

      {/* {hasChannel(NotificationChannelEnum.EMAIL, props.channels) && ( */}
      {/*  <> */}
      {/*    <PreferenceToggleRow */}
      {/*      label={I18n.t("services.emailForwarding")} */}
      {/*      onPress={(value: boolean) => onValueChange(value, "email")} */}
      {/*      value={getValueOrFalse(props.servicePreferenceStatus, "email")} */}
      {/*      onReload={loadPreferences} */}
      {/*      testID={"contact-preferences-email-switch"} */}
      {/*    /> */}
      {/*    <ItemSeparatorComponent noPadded /> */}
      {/*  </> */}
      {/* )} */}
    </>
  );
};

const mapStateToProps = (state: GlobalState) => {
  const servicePreferenceStatus = servicePreferenceSelector(state);
  const isLoading =
    pot.isLoading(servicePreferenceStatus) ||
    pot.isUpdating(servicePreferenceStatus);

  const isError =
    pot.isError(servicePreferenceStatus) ||
    (isStrictSome(servicePreferenceStatus) &&
      servicePreferenceStatus.value.kind !== "success");

  return {
    isLoading,
    isError,
    servicePreferenceStatus,
    currentService: serviceIDCurrentSelector(state)
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
  upsertServicePreference: (id: ServiceId, sp: ServicePreference) =>
    dispatch(upsertServicePreference.request({ id, ...sp })),
  loadServicePreference: (id: ServiceId) =>
    dispatch(loadServicePreference.request(id))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ContactPreferencesToggle);
