import React from 'react';
import {View, StyleSheet} from 'react-native';
import {SvgXml} from 'react-native-svg';
import NehurOnSvg from './NehurOnSvg';
import {ACCESSORY_SVGS} from '../assets/mascota/accessories';

/**
 * Componente visual de la mascota NehurOn:
 * Renderiza la base del hurón (base_nehuron.svg) y superpone dinámicamente
 * las capas vectoriales de Cabeza, Ojos y Boca.
 */
export default function AvatarView({
  size = 220,
  equipped,
  hatId,
  glassesId,
  mouthId,
  showBackground = false,
  style,
}) {
  const effectiveHat = equipped?.hat || equipped?.head || hatId || null;
  const effectiveGlasses = equipped?.glasses || equipped?.eyes || glassesId || null;
  const effectiveMouth = equipped?.mouth || equipped?.boca || mouthId || null;

  const hatXml = effectiveHat ? ACCESSORY_SVGS[effectiveHat] : null;
  const glassesXml = effectiveGlasses ? ACCESSORY_SVGS[effectiveGlasses] : null;
  const mouthXml = effectiveMouth ? ACCESSORY_SVGS[effectiveMouth] : null;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}>
      {/* Capa 1: Base Hurón NehurOn (base_nehuron.svg) */}
      <NehurOnSvg
        size={size}
        showBackground={showBackground}
        style={styles.baseSvg}
      />

      {/* Capa 2: Accesorio de Cabeza */}
      {hatXml && (
        <View pointerEvents="none" style={[styles.layer, styles.hatLayer]}>
          <SvgXml xml={hatXml} width={size} height={size} />
        </View>
      )}

      {/* Capa 3: Accesorio de Ojos / Lentes */}
      {glassesXml && (
        <View pointerEvents="none" style={[styles.layer, styles.glassesLayer]}>
          <SvgXml xml={glassesXml} width={size} height={size} />
        </View>
      )}

      {/* Capa 4: Accesorio de Boca */}
      {mouthXml && (
        <View pointerEvents="none" style={[styles.layer, styles.mouthLayer]}>
          <SvgXml xml={mouthXml} width={size} height={size} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  baseSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  hatLayer: {
    zIndex: 2,
  },
  glassesLayer: {
    zIndex: 3,
  },
  mouthLayer: {
    zIndex: 4,
  },
});
