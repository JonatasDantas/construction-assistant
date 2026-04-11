import { useState, useRef, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Animated, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Mic, Sparkles, Check, Edit2 } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { AppText } from '@/components/app-text';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';

// --- Types ---

type Stage = 'idle' | 'recording' | 'processing' | 'result';

interface StructuredEntry {
  service: string;
  category: string;
  teamSize: string;
  duration: string;
  description: string;
}

// --- Mock API (replace with real API calls) ---

async function mockTranscribeAudio(_uri: string | null): Promise<string> {
  await new Promise<void>((r) => setTimeout(r, 800));
  return 'Hoje fizemos a concretagem da laje do terceiro pavimento. Foram 8 pessoas trabalhando durante 4 horas. Tudo correu bem, sem intercorrências.';
}

async function mockSummarizeText(_text: string): Promise<StructuredEntry> {
  await new Promise<void>((r) => setTimeout(r, 700));
  return {
    service: 'Concretagem',
    category: 'Estrutura',
    teamSize: '8 pessoas',
    duration: '4 horas',
    description: 'Concretagem da laje do 3º pavimento finalizada conforme cronograma. Equipe de 8 funcionários trabalhou durante 4 horas sem intercorrências registradas.',
  };
}

// --- Screen ---

// Intentionally not in theme; value matches colors.destructive (#EF4444)
const RECORDING_RED = '#EF4444';
const MIC_SIZE = 96;

export default function VoiceInputScreen() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('idle');
  const [transcription, setTranscription] = useState('');
  const [structured, setStructured] = useState<StructuredEntry | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Pulse ring animations (recording stage)
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  // Spin animation (processing stage)
  const spin = useRef(new Animated.Value(0)).current;

  // Pulse rings: two ripples, second starts 500ms after first
  useEffect(() => {
    if (stage !== 'recording') {
      pulse1.setValue(0);
      pulse2.setValue(0);
      return;
    }

    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse1, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse1, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop1.start();

    let loop2: Animated.CompositeAnimation | null = null;
    const timer = setTimeout(() => {
      loop2 = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse2, { toValue: 1, duration: 1100, useNativeDriver: true }),
          Animated.timing(pulse2, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      );
      loop2.start();
    }, 500);

    return () => {
      loop1.stop();
      loop2?.stop();
      clearTimeout(timer);
      pulse1.setValue(0);
      pulse2.setValue(0);
    };
  }, [stage]);

  // Spin: continuous 360° rotation
  useEffect(() => {
    if (stage !== 'processing') {
      spin.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 2000, useNativeDriver: true }),
    );
    loop.start();

    return () => {
      loop.stop();
      spin.setValue(0);
    };
  }, [stage]);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const pulse1Scale = pulse1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const pulse1Opacity = pulse1.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 0.3, 0] });
  const pulse2Scale = pulse2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const pulse2Opacity = pulse2.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 0.3, 0] });

  const handleMicPress = async () => {
    if (stage === 'idle') {
      await startRecording();
    } else if (stage === 'recording') {
      await stopRecordingAndProcess();
    }
  };

  const startRecording = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Ative o acesso ao microfone nas configurações para gravar registros de obra.',
      );
      return;
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );
    recordingRef.current = recording;
    setStage('recording');
  };

  const stopRecordingAndProcess = async () => {
    setStage('processing');
    const recording = recordingRef.current;
    recordingRef.current = null;
    let uri: string | null = null;
    try {
      await recording?.stopAndUnloadAsync();
      uri = recording?.getURI() ?? null;
    } catch {
      // Continue with mock even if recording cleanup fails
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    try {
      const text = await mockTranscribeAudio(uri);
      const entry = await mockSummarizeText(text);
      setTranscription(text);
      setStructured(entry);
      setStage('result');
    } catch {
      Alert.alert('Erro', 'Não foi possível processar o áudio. Tente novamente.');
      setStage('idle');
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader onBack={() => router.back()} />

      {(stage === 'idle' || stage === 'recording') && (
        <View style={styles.listeningContainer}>
          <View style={styles.prompt}>
            <AppText size="2xl" weight="semibold" style={styles.promptTitle}>
              O que você fez hoje?
            </AppText>
            <AppText size="sm" color="secondary" style={styles.promptSubtitle}>
              {stage === 'idle'
                ? 'Toque no microfone e descreva o trabalho realizado'
                : 'Toque novamente para parar a gravação'}
            </AppText>
          </View>

          <View style={styles.micWrapper}>
            {stage === 'recording' && (
              <>
                <Animated.View
                  style={[
                    styles.pulseRing,
                    { transform: [{ scale: pulse1Scale }], opacity: pulse1Opacity },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.pulseRing,
                    { transform: [{ scale: pulse2Scale }], opacity: pulse2Opacity },
                  ]}
                />
              </>
            )}
            <TouchableOpacity
              style={[styles.micButton, stage === 'recording' && styles.micButtonRecording]}
              onPress={handleMicPress}
              activeOpacity={0.85}
            >
              <Mic size={40} color={colors.textInverse} />
            </TouchableOpacity>
          </View>

          {stage === 'recording' && (
            <AppText size="sm" weight="medium" style={styles.recordingLabel}>
              Gravando...
            </AppText>
          )}
        </View>
      )}

      {stage === 'processing' && (
        <View style={styles.processingContainer}>
          <Animated.View style={{ transform: [{ rotate: spinDeg }] }}>
            <Sparkles size={64} color={colors.primary} />
          </Animated.View>
          <AppText size="base" color="secondary" style={styles.processingLabel}>
            Processando com IA...
          </AppText>
        </View>
      )}

      {stage === 'result' && (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.resultContent}
            showsVerticalScrollIndicator={false}
          >
            {/* AI label + heading */}
            <View style={styles.resultHeader}>
              <View style={styles.aiLabelRow}>
                <Sparkles size={14} color={colors.primary} />
                <AppText size="xs" weight="medium" style={styles.aiLabelText}>
                  Sugerido pela IA
                </AppText>
              </View>
              <AppText size="xl" weight="semibold">Registro estruturado</AppText>
            </View>

            {/* Transcription */}
            <View style={styles.transcriptionBox}>
              <AppText size="xs" color="secondary">Transcrição</AppText>
              <AppText size="sm" style={styles.transcriptionText}>
                "{transcription}"
              </AppText>
            </View>

            {/* Structured fields */}
            <View style={styles.fieldsContainer}>
              <View style={styles.fieldBox}>
                <AppText size="xs" color="secondary">Serviço</AppText>
                <AppText size="base" weight="medium">{structured?.service}</AppText>
              </View>
              <View style={styles.fieldBox}>
                <AppText size="xs" color="secondary">Categoria</AppText>
                <AppText size="base" weight="medium">{structured?.category}</AppText>
              </View>
              <View style={styles.fieldRow}>
                <View style={[styles.fieldBox, styles.fieldBoxHalf]}>
                  <AppText size="xs" color="secondary">Equipe</AppText>
                  <AppText size="base" weight="medium">{structured?.teamSize}</AppText>
                </View>
                <View style={[styles.fieldBox, styles.fieldBoxHalf]}>
                  <AppText size="xs" color="secondary">Duração</AppText>
                  <AppText size="base" weight="medium">{structured?.duration}</AppText>
                </View>
              </View>
              <View style={styles.fieldBox}>
                <AppText size="xs" color="secondary">Descrição Formal</AppText>
                <AppText size="sm" style={styles.descriptionText}>
                  {structured?.description}
                </AppText>
              </View>
            </View>
          </ScrollView>

          {/* Fixed bottom action bar */}
          <View style={styles.actionBar}>
            {/* TODO: wire up edit flow when implemented */}
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              activeOpacity={0.8}
              onPress={() => {}}
            >
              <Edit2 size={16} color={colors.textPrimary} />
              <AppText size="base" weight="medium">Editar</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              activeOpacity={0.8}
              onPress={() => router.push('/(app)/add-photos')}
            >
              <Check size={16} color={colors.textInverse} />
              <AppText size="base" weight="medium" color="inverse">Confirmar</AppText>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  // Idle / recording stage
  listeningContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[12],
  },
  prompt: {
    alignItems: 'center',
    gap: spacing[2],
  },
  promptTitle: {
    textAlign: 'center',
  },
  promptSubtitle: {
    textAlign: 'center',
    maxWidth: 280,
  },
  micWrapper: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: radius.full,
    backgroundColor: RECORDING_RED,
  },
  micButton: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...(shadows.lg as object),
  },
  micButtonRecording: {
    backgroundColor: RECORDING_RED,
  },
  recordingLabel: {
    color: RECORDING_RED,
  },
  // Processing stage
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[6],
  },
  processingLabel: {
    textAlign: 'center',
  },
  // Result stage
  scroll: {
    flex: 1,
  },
  resultContent: {
    padding: spacing[6],
    paddingBottom: spacing[4],
    gap: spacing[6],
  },
  resultHeader: {
    gap: spacing[2],
  },
  aiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  aiLabelText: {
    color: colors.primary,
  },
  transcriptionBox: {
    backgroundColor: colors.borderLight,
    borderRadius: radius.xl,
    padding: spacing[4],
    gap: spacing[2],
  },
  transcriptionText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  fieldsContainer: {
    gap: spacing[4],
  },
  fieldBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing[4],
    gap: spacing[1],
  },
  fieldBoxHalf: {
    flex: 1,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  descriptionText: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  // Bottom action bar
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
});
