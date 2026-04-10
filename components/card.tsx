import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { radius as radiusTokens } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';

type ShadowSize = 'none' | keyof typeof shadows;
type RadiusSize = keyof typeof radiusTokens;

interface CardProps extends ViewProps {
  shadow?: ShadowSize;
  radius?: RadiusSize;
}

export function Card({ shadow = 'sm', radius = 'lg', style, children, ...props }: CardProps) {
  const shadowStyle = shadow !== 'none' ? shadows[shadow] : undefined;
  const borderRadius = radiusTokens[radius];

  return (
    <View
      style={[styles.shadow, shadowStyle, { borderRadius }, style]}
      {...props}
    >
      <View style={[styles.inner, { borderRadius }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    backgroundColor: colors.surface,
  },
  inner: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
