import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type BgType = 'background' | 'surface' | 'dark';

interface AppContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  bg?: BgType;
  contentPadding?: boolean;
}

const bgColorMap: Record<BgType, string> = {
  background: colors.background,
  surface: colors.surface,
  dark: colors.surfaceDark,
};

export function AppContainer({
  children,
  scrollable = true,
  bg = 'background',
  contentPadding = true,
}: AppContainerProps) {
  const bgColor = bgColorMap[bg];

  const inner = scrollable ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        contentPadding && styles.padding,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, contentPadding && styles.padding]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {inner}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  padding: {
    paddingHorizontal: spacing[4],
  },
});
