import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { AppContainer } from '@/components/app-container';
import { ScreenHeader } from '@/components/screen-header';
import { StatsCard } from '@/components/stats-card';
import { AppText } from '@/components/app-text';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';

const TAB_BAR_HEIGHT = 60; // matches tabBarStyle.height in (tabs)/_layout.tsx

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <ScreenHeader
        projectName="Edifício Residencial Parque das Flores"
        onProjectPress={() => router.push('/(app)/(tabs)/projects')}
      />
      <AppContainer contentPadding>
        <StatsCard records={12} hours="48h" people={32} />
        <AppText size="sm" color="secondary" style={styles.placeholder}>
          Registros aparecerão aqui — tela em migração.
        </AppText>
      </AppContainer>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/voice-input')}
        activeOpacity={0.85}
      >
        <Plus size={24} color={colors.textInverse} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  placeholder: {
    textAlign: 'center',
    marginTop: spacing[8],
  },
  fab: {
    position: 'absolute',
    bottom: TAB_BAR_HEIGHT + spacing[4], // spacing[4] = 16, total 76
    right: spacing[6],
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
});
