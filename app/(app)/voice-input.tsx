import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Mic } from 'lucide-react-native';
import { AppContainer } from '@/components/app-container';
import { ScreenHeader } from '@/components/screen-header';
import { AppText } from '@/components/app-text';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';

export default function VoiceInputScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <ScreenHeader onBack={() => router.back()} title="Novo Registro" />
      <AppContainer scrollable={false} contentPadding>
        <View style={styles.center}>
          <View style={styles.micButton}>
            <Mic size={40} color={colors.textInverse} />
          </View>
          <AppText size="xl" weight="semibold" style={styles.title}>
            O que você fez hoje?
          </AppText>
          <AppText size="sm" color="secondary" style={styles.subtitle}>
            Tela em migração — gravação de voz será implementada aqui.
          </AppText>
        </View>
      </AppContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
  },
  micButton: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 280,
  },
});
