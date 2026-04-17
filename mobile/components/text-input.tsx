import React from 'react';
import { View, TextInput as RNTextInput, TextInputProps, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { fontSize } from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';
import { AppText } from './app-text';

interface AppInputProps extends TextInputProps {
  label?: string;
}

export function AppInput({ label, style, ...props }: AppInputProps) {
  return (
    <View style={styles.container}>
      {label && (
        <AppText size="sm" weight="medium">
          {label}
        </AppText>
      )}
      <RNTextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[1],
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: fontSize.base,
    color: colors.textPrimary,
    minHeight: spacing[12],
  },
});
