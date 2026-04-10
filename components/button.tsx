import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  View,
  StyleSheet,
} from 'react-native';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { AppText } from './app-text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  children: string;
}

const variantStyles: Record<
  ButtonVariant,
  { bg: string; textColor: 'inverse' | 'primary' | 'brand' }
> = {
  primary: { bg: colors.primary, textColor: 'inverse' },
  secondary: { bg: '#F3F4F6', textColor: 'primary' },
  ghost: { bg: colors.glassLight, textColor: 'inverse' },
  destructive: { bg: colors.destructive, textColor: 'inverse' },
};

export function Button({
  variant = 'primary',
  icon,
  loading = false,
  fullWidth = false,
  children,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const { bg, textColor } = variantStyles[variant];

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { backgroundColor: bg },
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor === 'inverse' ? colors.textInverse : colors.textPrimary} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <AppText size="base" weight="medium" color={textColor}>
            {children}
          </AppText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
