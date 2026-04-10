import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { completeOnboarding } from '@/hooks/use-onboarding';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleStart = async () => {
    await completeOnboarding();
    router.replace('/(app)/(tabs)/');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[colors.gradientStart, '#1E40AF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.inner}>
          <View style={styles.iconContainer}>
            <FileText size={40} color={colors.textInverse} />
          </View>

          <AppText size="3xl" weight="bold" color="inverse" style={styles.title}>
            {'Diário de Obras\nInteligente'}
          </AppText>
          <AppText size="base" color="inverse" style={styles.subtitle}>
            Registre obras usando sua voz e IA
          </AppText>

          <Button
            variant="secondary"
            fullWidth
            onPress={handleStart}
            style={styles.button}
          >
            Começar Agora
          </Button>

          <AppText size="xs" color="inverse" style={styles.footnote}>
            Ideal para engenheiros, mestres de obra e gestores de construção
          </AppText>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.gradientStart,
  },
  gradient: {
    flex: 1,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: colors.glassLight,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.85,
    marginBottom: spacing[8],
  },
  button: {
    marginBottom: spacing[4],
  },
  footnote: {
    textAlign: 'center',
    opacity: 0.7,
    maxWidth: 280,
  },
});
