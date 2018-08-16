import { View } from "native-base";
import * as React from "react";
import { ReactOutput, SingleASTNode, State } from "simple-markdown";

import { makeReactNativeRule } from "./utils";

function rule() {
  return (
    node: SingleASTNode,
    output: ReactOutput,
    state: State
  ): React.ReactNode => {
    return React.createElement(
      View,
      {
        key: state.key,
        style: {
          flexWrap: "wrap",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start"
        }
      },
      output(node.content, state)
    );
  };
}

export default makeReactNativeRule(rule());
