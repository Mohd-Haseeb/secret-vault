import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type Props = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tintColor?: string;
  interactive?: boolean;
};

// Resolved once: the native iOS 26 Liquid Glass API either exists or it doesn't.
const hasLiquidGlass = isGlassEffectAPIAvailable();

/**
 * iOS 26 Liquid Glass surface. Falls back to a translucent, hairline-bordered
 * view on older iOS, Android and web.
 */
const GlassSurface: React.FC<Props> = ({
  children,
  style,
  tintColor,
  interactive = false,
}) => {
  if (hasLiquidGlass) {
    return (
      <GlassView
        glassEffectStyle="regular"
        colorScheme="dark"
        tintColor={tintColor}
        isInteractive={interactive}
        style={[styles.glass, style]}
      >
        {children}
      </GlassView>
    );
  }

  return <View style={[styles.fallback, style]}>{children}</View>;
};

export default React.memo(GlassSurface);

const styles = StyleSheet.create({
  glass: {
    overflow: 'hidden',
  },
  fallback: {
    backgroundColor: 'rgba(22, 34, 54, 0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    overflow: 'hidden',
  },
});
