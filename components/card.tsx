import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { radius as radiusTokens } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';

type ShadowSize = 'none' | 'sm' | 'md' | 'lg';
type RadiusSize = 'sm' | 'md' | 'lg' | 'xl';

interface CardProps extends ViewProps {
  shadow?: ShadowSize;
  radius?: RadiusSize;
}

export function Card({ shadow = 'sm', radius = 'lg', style, children, ...props }: CardProps) {
  const shadowStyle = shadow !== 'none' ? shadows[shadow] : undefined;

  return (
    <View
      style={[
        styles.base,
        { borderRadius: radiusTokens[radius] },
        shadowStyle,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
