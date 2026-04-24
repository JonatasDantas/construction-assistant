import { useState, useRef, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Image, Dimensions, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, Images, X, Check, AlertCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppText } from '@/components/app-text';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';
import { useProject } from '@/context/project-context';
import { requestPresignedUrl, uploadToS3 } from '@/utils/photos-api';

const MAX_PHOTOS = 10;
const GRID_COLUMNS = 3;
const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = spacing[2];
const THUMBNAIL_SIZE =
  (SCREEN_WIDTH - spacing[4] * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

type PhotoStatus = 'uploading' | 'done' | 'error';

interface PhotoItem {
  id: string;
  uri: string;
  filename: string;
  contentType: string;
  status: PhotoStatus;
  key?: string;
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function mimeFromUri(uri: string): string {
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

export default function AddPhotosScreen() {
  const router = useRouter();
  const { activeProject } = useProject();
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  // logId is stable for the lifetime of this screen session
  const logIdRef = useRef<string>(uuid());

  const isUploading = photos.some((p) => p.status === 'uploading');
  const atMax = photos.length >= MAX_PHOTOS;

  const startUpload = useCallback(async (photo: PhotoItem) => {
    if (!activeProject) {
      setPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, status: 'error' } : p)),
      );
      return;
    }

    try {
      const { uploadUrl, key } = await requestPresignedUrl(
        activeProject.id,
        logIdRef.current,
        photo.filename,
        photo.contentType,
      );
      await uploadToS3(uploadUrl, photo.uri, photo.contentType);
      setPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, status: 'done', key } : p)),
      );
    } catch {
      setPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, status: 'error' } : p)),
      );
    }
  }, [activeProject]);

  const addPhotos = useCallback((uris: string[]) => {
    const newItems: PhotoItem[] = uris.map((uri) => {
      const filename = `${uuid()}.jpg`;
      const contentType = mimeFromUri(uri);
      return { id: uuid(), uri, filename, contentType, status: 'uploading' };
    });
    setPhotos((prev) => [...prev, ...newItems].slice(0, MAX_PHOTOS));
    newItems.forEach((item) => startUpload(item));
  }, [startUpload]);

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
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) {
      addPhotos([result.assets[0].uri]);
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
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
    });
    if (!result.canceled) {
      addPhotos(result.assets.map((a) => a.uri));
    }
  };

  const handleRemove = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleFinish = () => {
    const s3Keys = photos.filter((p) => p.status === 'done').map((p) => p.key as string);
    Alert.alert('Registro criado com sucesso!', `${s3Keys.length} foto(s) enviada(s).`, [
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
            {photos.map((photo) => (
              <View key={photo.id} style={styles.thumbnailContainer}>
                <Image
                  source={{ uri: photo.uri }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />

                {/* Upload status overlay */}
                {photo.status === 'uploading' && (
                  <View style={styles.statusOverlay}>
                    <ActivityIndicator size="small" color={colors.textInverse} />
                  </View>
                )}
                {photo.status === 'error' && (
                  <View style={[styles.statusOverlay, styles.statusOverlayError]}>
                    <AlertCircle size={18} color={colors.textInverse} />
                  </View>
                )}
                {photo.status === 'done' && (
                  <View style={[styles.statusBadge, styles.statusBadgeDone]}>
                    <Check size={10} color={colors.textInverse} />
                  </View>
                )}

                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemove(photo.id)}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
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
            style={[
              styles.actionButton,
              styles.actionButtonPrimary,
              isUploading && styles.actionButtonDisabled,
            ]}
            onPress={handleFinish}
            activeOpacity={0.8}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Check size={16} color={colors.textInverse} />
            )}
            <AppText size="base" weight="medium" color="inverse">
              {isUploading ? 'Enviando...' : 'Concluir'}
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
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOverlayError: {
    backgroundColor: 'rgba(239,68,68,0.7)',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeDone: {
    backgroundColor: colors.success,
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
