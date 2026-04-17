import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, ArrowLeft } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';
import { AppText } from './app-text';

interface ScreenHeaderProps {
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  projectName?: string;
  onProjectPress?: () => void;
}

export function ScreenHeader({
  onBack,
  title,
  subtitle,
  action,
  projectName,
  onProjectPress,
}: ScreenHeaderProps) {
  const leftContent = onBack ? (
    <>
      <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={8}>
        <ArrowLeft size={20} color={colors.textPrimary} />
      </TouchableOpacity>
      {title && (
        <View>
          <AppText size="base" weight="semibold">{title}</AppText>
          {subtitle && <AppText size="sm" color="secondary">{subtitle}</AppText>}
        </View>
      )}
    </>
  ) : projectName !== undefined ? (
    <TouchableOpacity onPress={onProjectPress} style={styles.projectSelector}>
      <AppText size="xs" color="secondary">Projeto Atual</AppText>
      <View style={styles.projectNameRow}>
        <AppText size="base" weight="medium" numberOfLines={1} style={styles.projectName}>
          {projectName}
        </AppText>
        <ChevronDown size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  ) : (title || subtitle) ? (
    <View>
      {title && <AppText size="base" weight="semibold">{title}</AppText>}
      {subtitle && <AppText size="sm" color="secondary">{subtitle}</AppText>}
    </View>
  ) : null;

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing[3] }]}>
      <View style={styles.left}>{leftContent}</View>
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    ...shadows.sm,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  backButton: {
    padding: spacing[1],
  },
  projectSelector: {
    flex: 1,
  },
  projectNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  projectName: {
    flex: 1,
  },
  action: {
    marginLeft: spacing[3],
  },
});
