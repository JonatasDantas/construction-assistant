import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FileText, Mic, Sparkles, Camera, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { completeOnboarding } from '@/hooks/use-onboarding';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';

const FEATURES = [
  {
    icon: Mic,
    title: 'Fale o que fez',
    description: 'Grave sua voz e o sistema transcreve automaticamente',
    iconBg: '#3B82F6',
  },
  {
    icon: Sparkles,
    title: 'IA Estrutura',
    description: 'Inteligência artificial organiza e formata os dados',
    iconBg: '#A855F7',
  },
  {
    icon: Camera,
    title: 'Adicione Fotos',
    description: 'Documente visualmente cada etapa da obra',
    iconBg: '#22C55E',
  },
  {
    icon: FileText,
    title: 'Gere Relatórios',
    description: 'PDFs profissionais prontos em segundos',
    iconBg: '#F97316',
  },
] as const;

type Feature = (typeof FEATURES)[number];

const featureRows = [FEATURES.slice(0, 2), FEATURES.slice(2, 4)];

export default function WelcomeScreen() {
  const router = useRouter();

  const handleStart = async () => {
    await completeOnboarding();
    router.replace('/(app)/(tabs)/');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.inner}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Logo */}
          <View style={styles.iconContainer}>
            <FileText size={40} color={colors.textInverse} />
          </View>

          <AppText size="3xl" weight="bold" color="inverse" style={styles.title}>
            {'Diário de Obras\nInteligente'}
          </AppText>
          <AppText size="base" color="inverse" style={styles.subtitle}>
            Registre obras usando sua voz e IA
          </AppText>

          {/* Feature Cards Grid */}
          <View style={styles.grid}>
            {featureRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.gridRow}>
                {row.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <View key={feature.title} style={styles.featureCard}>
                      <View style={[styles.featureIconBg, { backgroundColor: feature.iconBg }]}>
                        <Icon size={20} color={colors.textInverse} />
                      </View>
                      <AppText size="sm" weight="medium" color="inverse" style={styles.featureTitle}>
                        {feature.title}
                      </AppText>
                      <AppText size="xs" color="inverse" style={styles.featureDesc}>
                        {feature.description}
                      </AppText>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          {/* CTA */}
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

          {/* Saiba mais */}
          {/* TODO: navigate to about/onboarding info screen when implemented */}
          <TouchableOpacity style={styles.infoButton} onPress={() => {}}>
            <Info size={16} color={colors.textInverse} />
            <AppText size="sm" color="inverse">Saiba mais</AppText>
          </TouchableOpacity>
        </ScrollView>
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
  scroll: {
    flex: 1,
  },
  inner: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[8],
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
    marginBottom: spacing[6],
  },
  grid: {
    width: '100%',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  featureCard: {
    flex: 1,
    backgroundColor: colors.glassLight,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: spacing[3],
  },
  featureIconBg: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  featureTitle: {
    marginBottom: spacing[1],
  },
  featureDesc: {
    opacity: 0.8,
    lineHeight: 16,
  },
  button: {
    marginBottom: spacing[4],
  },
  footnote: {
    textAlign: 'center',
    opacity: 0.7,
    maxWidth: 280,
    marginBottom: spacing[2],
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    opacity: 0.8,
  },
});
