import React from 'react';
import { StyleSheet, View } from 'react-native';

/** Soft colour blobs so glass surfaces have something to refract. */
const GlassBackdrop: React.FC = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <View style={[styles.blob, styles.lime]} />
    <View style={[styles.blob, styles.blue]} />
  </View>
);

export default React.memo(GlassBackdrop);

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  lime: {
    top: -80,
    right: -100,
    width: 320,
    height: 320,
    backgroundColor: 'rgba(213, 255, 95, 0.16)',
  },
  blue: {
    bottom: 120,
    left: -140,
    width: 380,
    height: 380,
    backgroundColor: 'rgba(70, 130, 255, 0.22)',
  },
});
