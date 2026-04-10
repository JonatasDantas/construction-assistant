import React from 'react';
import { View, TextInput as RNTextInput, TextInputProps, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { AppText } from './app-text';

interface AppInputProps extends TextInputProps {
  label?: string;
}

export function AppInput({ label, style, ...props }: AppInputProps) {
  return (
    <View style={styles.container}>
      {label && (
        <AppText size="sm" weight="medium" style={styles.label}>
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
  label: {
    marginBottom: spacing[1],
  },
  input: {
    backgroundColor: '#F3F3F5',
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: spacing[12],
  },
});
