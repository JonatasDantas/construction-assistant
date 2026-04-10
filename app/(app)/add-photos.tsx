import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { AppContainer } from '@/components/app-container';
import { ScreenHeader } from '@/components/screen-header';
import { AppText } from '@/components/app-text';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';

export default function AddPhotosScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <ScreenHeader onBack={() => router.back()} title="Adicionar Fotos" />
      <AppContainer scrollable={false} contentPadding>
        <View style={styles.center}>
          <View style={styles.cameraIcon}>
            <Camera size={48} color={colors.textMuted} />
          </View>
          <AppText size="xl" weight="semibold" style={styles.title}>
            Câmera
          </AppText>
          <AppText size="sm" color="secondary" style={styles.subtitle}>
            Tela em migração — integração com expo-camera será implementada aqui.
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
  cameraIcon: {
    width: 96,
    height: 96,
    borderRadius: radius.xl,
    backgroundColor: colors.borderLight,
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
