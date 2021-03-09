import React, { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Otp } from "../../../../../../definitions/cgn/Otp";
import { IOColors } from "../../../../../components/core/variables/IOColors";
import { addEvery } from "../../../../../utils/strings";
import { BaseTypography } from "../../../../../components/core/typography/BaseTypography";
import CopyButtonComponent from "../../../../../components/CopyButtonComponent";

type Props = {
  otp: Otp;
  onEnd: () => void;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOColors.white,
    flex: 1
  },
  otpContainer: {
    justifyContent: "center",
    flexDirection: "row"
  },
  optCode: { fontSize: 20, padding: 4, marginRight: 4, textAlign: "center" }
});

const OtpCodeComponent = (code: string) => (
  <BaseTypography color={"blue"} weight={"Regular"} fontStyle={styles.optCode}>
    {code}
  </BaseTypography>
);

export const OtpCodeRefreshComponent = (props: Props) => {
  const formattedCode = addEvery(props.otp.code, " ", 3);
  const [translateX] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(translateX, {
      useNativeDriver: false,
      toValue: 100,
      duration: 3000,
      easing: Easing.linear
    }).start(() => {
      translateX.setValue(0);
      props.onEnd();
    });
  }, [props.otp.code]);

  return (
    <View style={styles.container}>
      <View style={styles.otpContainer}>
        {OtpCodeComponent(formattedCode)}
        <CopyButtonComponent textToCopy={formattedCode} />
      </View>
      <View
        style={{
          alignSelf: "center",
          marginBottom: 10,
          backgroundColor: "#d9d9d9",
          width: "90%",
          height: 6,
          margin: 4,
          borderRadius: 4
        }}
      >
        <Animated.View
          style={[
            {
              alignSelf: "flex-start",
              backgroundColor: IOColors.blue,
              width: "50%",
              height: 6,
              borderRadius: 4
            },
            {
              width: translateX.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"]
              })
            }
          ]}
        />
      </View>
    </View>
  );
};