import React from 'react';
import { Text, TextProps } from 'react-native';
import { colors } from '@/theme/colors';
import { fontSize, fontWeight } from '@/theme/typography';

type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';
type TextColor = 'primary' | 'secondary' | 'muted' | 'inverse' | 'brand';

const colorMap: Record<TextColor, string> = {
  primary: colors.textPrimary,
  secondary: colors.textSecondary,
  muted: colors.textMuted,
  inverse: colors.textInverse,
  brand: colors.primary,
};

interface AppTextProps extends TextProps {
  size?: TextSize;
  weight?: TextWeight;
  color?: TextColor;
}

export function AppText({
  size = 'base',
  weight = 'normal',
  color = 'primary',
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      style={[
        {
          fontSize: fontSize[size],
          fontWeight: fontWeight[weight],
          color: colorMap[color],
        },
        style,
      ]}
      {...props}
    />
  );
}
