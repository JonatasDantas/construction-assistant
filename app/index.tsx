import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useOnboarding } from '@/hooks/use-onboarding';
import { colors } from '@/theme/colors';

export default function Index() {
  const { isReady, hasCompleted } = useOnboarding();

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Redirect href={hasCompleted ? '/(app)/(tabs)/' : '/(onboarding)/welcome'} />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
