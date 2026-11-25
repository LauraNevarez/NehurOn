import React from 'react';
import {View} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {BASE_NEHURON_SVG} from '../assets/mascota/accessories';

/**
 * Renderiza la base oficial del hurón directamente desde base_nehuron.svg
 * (sincronizado automáticamente con tools/sync-accessories.js).
 */
export default function NehurOnSvg({
  size = 200,
  showBackground = false,
  backgroundColor = '#f9ba51',
  style,
}) {
  const hasBg =
    showBackground &&
    backgroundColor &&
    backgroundColor !== 'transparent' &&
    backgroundColor !== 'none';

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: hasBg ? backgroundColor : 'transparent',
        },
        style,
      ]}>
      <SvgXml xml={BASE_NEHURON_SVG} width={size} height={size} />
    </View>
  );
}
