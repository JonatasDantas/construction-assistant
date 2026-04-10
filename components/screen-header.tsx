import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown, ArrowLeft } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';
import { AppText } from './app-text';

interface ScreenHeaderProps {
  /** Back button pattern */
  onBack?: () => void;
  /** Title shown in back + title patterns */
  title?: string;
  /** Subtitle shown below title */
  subtitle?: string;
  /** Action node rendered on the right (e.g. share icon) */
  action?: React.ReactNode;
  /** Project selector pattern — renders project name + chevron */
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
  return (
    <View style={styles.container}>
      {/* Left: back button or project selector */}
      <View style={styles.left}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={8}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        )}

        {projectName !== undefined ? (
          <TouchableOpacity onPress={onProjectPress} style={styles.projectSelector}>
            <AppText size="xs" color="secondary">
              Projeto Atual
            </AppText>
            <View style={styles.projectNameRow}>
              <AppText size="base" weight="medium" numberOfLines={1} style={styles.projectName}>
                {projectName}
              </AppText>
              <ChevronDown size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        ) : (
          <View>
            {title && (
              <AppText size="base" weight="semibold">
                {title}
              </AppText>
            )}
            {subtitle && (
              <AppText size="sm" color="secondary">
                {subtitle}
              </AppText>
            )}
          </View>
        )}
      </View>

      {/* Right: optional action */}
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
