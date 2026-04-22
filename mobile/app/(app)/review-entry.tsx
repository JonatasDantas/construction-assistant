import { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { AppText } from '@/components/app-text';
import { AppInput } from '@/components/text-input';
import { ScreenHeader } from '@/components/screen-header';
import { useProject } from '@/context/project-context';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';
import { createLogEntry } from '@/utils/logs-api';

export default function ReviewEntryScreen() {
  const router = useRouter();
  const { activeProject } = useProject();

  const params = useLocalSearchParams<{
    serviceType: string;
    teamSize: string;
    description: string;
    formalDescription: string;
  }>();

  const [serviceType, setServiceType] = useState(params.serviceType ?? '');
  const [teamSize, setTeamSize] = useState(params.teamSize ?? '');
  const [description, setDescription] = useState(params.description ?? '');
  const [formalDescription, setFormalDescription] = useState(params.formalDescription ?? '');
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!activeProject) {
      Alert.alert('Nenhum projeto ativo', 'Selecione um projeto antes de salvar.');
      return;
    }
    setLoading(true);
    try {
      await createLogEntry({
        serviceType,
        teamSize,
        description,
        formalDescription,
        projectId: activeProject.id,
        timestamp: new Date().toISOString(),
      });
      router.replace('/(app)/(tabs)');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar registro.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  function handleDiscard() {
    router.replace('/(app)/(tabs)');
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        onBack={handleDiscard}
        title="Revisar Registro"
        subtitle="Edite os campos antes de salvar"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <AppInput
          label="Tipo de Serviço"
          value={serviceType}
          onChangeText={setServiceType}
          placeholder="Ex: Concretagem"
        />
        <AppInput
          label="Equipe"
          value={teamSize}
          onChangeText={setTeamSize}
          placeholder="Ex: 8 pessoas"
        />
        <AppInput
          label="Transcrição Original"
          value={description}
          onChangeText={setDescription}
          placeholder="Descrição original da voz"
          multiline
          style={styles.multiline}
        />
        <AppInput
          label="Descrição Formal"
          value={formalDescription}
          onChangeText={setFormalDescription}
          placeholder="Descrição formal gerada pela IA"
          multiline
          style={styles.multiline}
        />
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          activeOpacity={0.8}
          onPress={handleDiscard}
          disabled={loading}
        >
          <X size={16} color={colors.textPrimary} />
          <AppText size="base" weight="medium">Descartar</AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonPrimary, loading && styles.actionButtonDisabled]}
          activeOpacity={0.8}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <>
              <Check size={16} color={colors.textInverse} />
              <AppText size="base" weight="medium" color="inverse">Confirmar</AppText>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    gap: spacing[4],
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  actionBar: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
  },
  actionButtonSecondary: {
    backgroundColor: colors.inputBackground,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
});
