import { Option } from "fp-ts/lib/Option";
import * as React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";
import pagoBancomatImage from "../../../../../../img/wallet/cards-icons/pagobancomat.png";
import { Body } from "../../../../../components/core/typography/Body";
import { IOStyles } from "../../../../../components/core/variables/IOStyles";
import I18n from "../../../../../i18n";
import { EnhancedBancomat } from "../../../../../store/reducers/wallet/wallets";
import { CardPreview } from "../../../component/CardPreview";
import { useImageResize } from "../screens/hooks/useImageResize";

type Props = { bancomat: EnhancedBancomat };

const BASE_IMG_W = 160;
const BASE_IMG_H = 20;

/**
 * Render the image (if available) or the bank name (if available)
 * or the generic bancomat string (final fallback).
 * @param props
 * @param size
 */
const renderLeft = (props: Props, size: Option<[number, number]>) =>
  size.fold(
    <Body style={IOStyles.flex} numberOfLines={1}>
      {props.bancomat.abiInfo?.name ?? I18n.t("wallet.methods.bancomat.name")}
    </Body>,
    imgDim => {
      const imageUrl = props.bancomat.abiInfo?.logoUrl;
      const imageStyle: StyleProp<ImageStyle> = {
        width: imgDim[0],
        height: imgDim[1],
        resizeMode: "contain"
      };
      return imageUrl ? (
        <Image source={{ uri: imageUrl }} style={imageStyle} />
      ) : null;
    }
  );

/**
 * A card preview for a bancomat card
 * @param props
 * @constructor
 */
export const BancomatWalletPreview: React.FunctionComponent<Props> = props => {
  const imgDimensions = useImageResize(
    BASE_IMG_W,
    BASE_IMG_H,
    props.bancomat.abiInfo?.logoUrl
  );

  return (
    <CardPreview
      left={renderLeft(props, imgDimensions)}
      image={pagoBancomatImage}
    />
  );
};
