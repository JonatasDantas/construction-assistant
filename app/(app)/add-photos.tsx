import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Image, Dimensions, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, Images, X, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppText } from '@/components/app-text';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';

const MAX_PHOTOS = 10;
const GRID_COLUMNS = 3;
const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = spacing[2];
const THUMBNAIL_SIZE =
  (SCREEN_WIDTH - spacing[4] * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

export default function AddPhotosScreen() {
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>([]);

  const atMax = photos.length >= MAX_PHOTOS;

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Ative o acesso à câmera nas configurações para fotografar registros.',
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, result.assets[0].uri].slice(0, MAX_PHOTOS));
    }
  };

  const handleGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Ative o acesso à galeria nas configurações para importar fotos.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
    });
    if (!result.canceled) {
      setPhotos((prev) =>
        [...prev, ...result.assets.map((a) => a.uri)].slice(0, MAX_PHOTOS),
      );
    }
  };

  const handleRemove = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFinish = () => {
    Alert.alert('Registro criado com sucesso!', '', [
      { text: 'OK', onPress: () => router.replace('/(app)/(tabs)') },
    ]);
  };

  const countLabel = `${photos.length}/${MAX_PHOTOS} foto${photos.length !== 1 ? 's' : ''}`;

  return (
    <View style={styles.root}>
      <ScreenHeader
        onBack={() => router.back()}
        title="Adicionar Fotos"
        action={
          <View style={styles.countBadge}>
            <AppText size="xs" weight="medium" style={styles.countText}>
              {countLabel}
            </AppText>
          </View>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {photos.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Camera size={40} color={colors.textMuted} />
            </View>
            <AppText size="xl" weight="semibold" style={styles.emptyTitle}>
              Nenhuma foto adicionada
            </AppText>
            <AppText size="sm" color="secondary" style={styles.emptySubtitle}>
              Use os botões abaixo para tirar ou importar fotos da obra
            </AppText>
          </View>
        ) : (
          <View style={styles.grid}>
            {photos.map((uri, index) => (
              <View key={index} style={styles.thumbnailContainer}>
                <Image
                  source={{ uri }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemove(index)}
                  hitSlop={4}
                >
                  <X size={12} color={colors.textInverse} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.actionButtonSecondary,
            atMax && styles.actionButtonDisabled,
          ]}
          onPress={handleCamera}
          activeOpacity={0.8}
          disabled={atMax}
        >
          <Camera size={16} color={atMax ? colors.textMuted : colors.textPrimary} />
          <AppText size="base" weight="medium" color={atMax ? 'muted' : 'primary'}>
            Câmera
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.actionButtonSecondary,
            atMax && styles.actionButtonDisabled,
          ]}
          onPress={handleGallery}
          activeOpacity={0.8}
          disabled={atMax}
        >
          <Images size={16} color={atMax ? colors.textMuted : colors.textPrimary} />
          <AppText size="base" weight="medium" color={atMax ? 'muted' : 'primary'}>
            Galeria
          </AppText>
        </TouchableOpacity>
        {photos.length > 0 && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={handleFinish}
            activeOpacity={0.8}
          >
            <Check size={16} color={colors.textInverse} />
            <AppText size="base" weight="medium" color="inverse">
              Concluir
            </AppText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: radius.xl,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    maxWidth: 280,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  thumbnailContainer: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    position: 'relative',
  },
  thumbnailImage: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: radius.md,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
    ...(shadows.sm as object),
  },
  countBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  countText: {
    color: colors.primary,
  },
  actionBar: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radius.xl,
  },
  actionButtonSecondary: {
    backgroundColor: colors.borderLight,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
});
