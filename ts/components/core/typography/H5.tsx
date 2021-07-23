import * as React from "react";
import { IOFontFamily, IOFontWeight } from "../fonts";
import { IOColorType } from "../variables/IOColors";
import { ExternalTypographyProps } from "./common";
import { typographyFactory } from "./Factory";

// these colors are allowed only when the weight is SemiBold
type AllowedSemiBoldColors = Extract<
  IOColorType,
  // tslint:disable-next-line:max-union-size
  "bluegreyDark" | "bluegrey" | "bluegreyLight" | "blue" | "white" | "red"
>;

// when the weight is bold, only the white color is allowed
type AllowedRegularColors = Extract<
  IOColorType,
  | "bluegreyDark"
  | "bluegrey"
  | "bluegreyLight"
  | "blue"
  | "white"
  | "red"
  | "grey"
>;

// all the possible colors
type AllowedColors = AllowedSemiBoldColors | AllowedRegularColors;

// all the possible weight
type AllowedWeight = Extract<IOFontWeight, "SemiBold" | "Regular">;

// these are the properties allowed only if weight is undefined or SemiBold
type SemiBoldProps = {
  weight?: Extract<IOFontWeight, "SemiBold">;
  color?: AllowedSemiBoldColors;
};

// these are the properties allowed only if weight is Bold
type RegularProps = {
  weight: Extract<IOFontWeight, "Regular">;
  color?: AllowedRegularColors;
};

type BoldKindProps = SemiBoldProps | RegularProps;

type OwnProps = ExternalTypographyProps<BoldKindProps>;

const fontName: IOFontFamily = "TitilliumWeb";
const fontSize = 14;

/**
 * Typography component to render `H5` text with font size {@link fontSize} and fontFamily {@link fontName}.
 * default values(if not defined) are weight: `SemiBold`, color: `bluegreyDark`
 * @param props
 * @constructor
 */
export const H5: React.FunctionComponent<OwnProps> = props =>
  typographyFactory<AllowedWeight, AllowedColors>({
    ...props,
    defaultWeight: "SemiBold",
    defaultColor: "bluegreyDark",
    font: fontName,
    fontStyle: { fontSize }
  });
