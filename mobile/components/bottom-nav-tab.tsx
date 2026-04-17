import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function BottomNavTab({
  children,
  style,
  onPress,
  onLongPress,
  accessibilityState,
}: BottomTabBarButtonProps) {
  const isActive = accessibilityState?.selected ?? false;

  return (
    <TouchableOpacity
      style={[styles.tab, style]}
      onPress={onPress ?? undefined}
      onLongPress={onLongPress ?? undefined}
      activeOpacity={0.7}
    >
      <View style={[styles.indicator, !isActive && styles.indicatorHidden]} />
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
  },
  indicatorHidden: {
    opacity: 0,
  },
});
