import { useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { AppText } from '@/components/app-text';
import { ScreenHeader } from '@/components/screen-header';
import { useProject } from '@/context/project-context';
import { createLogEntry } from '@/utils/logs-api';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';

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

  const handleConfirm = async () => {
    if (!activeProject) {
      Alert.alert('Nenhum projeto ativo', 'Selecione um projeto antes de salvar o registro.');
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
      const message = err instanceof Error ? err.message : 'Tente novamente.';
      Alert.alert('Erro ao salvar registro', message);
      setLoading(false);
    }
  };

  const handleDiscard = () => {
    router.replace('/(app)/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader onBack={() => router.back()} title="Revisar Registro" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Field label="Tipo de Serviço">
          <TextInput
            style={styles.input}
            value={serviceType}
            onChangeText={setServiceType}
            placeholder="Ex: Concretagem"
            placeholderTextColor={colors.textMuted}
          />
        </Field>

        <Field label="Equipe">
          <TextInput
            style={styles.input}
            value={teamSize}
            onChangeText={setTeamSize}
            placeholder="Ex: 8 pessoas"
            placeholderTextColor={colors.textMuted}
          />
        </Field>

        <Field label="Transcrição">
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Descrição original do áudio"
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />
        </Field>

        <Field label="Descrição Formal">
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={formalDescription}
            onChangeText={setFormalDescription}
            placeholder="Descrição formal gerada pela IA"
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />
        </Field>
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={handleDiscard}
          activeOpacity={0.8}
          disabled={loading}
        >
          <X size={16} color={colors.textPrimary} />
          <AppText size="base" weight="medium">Descartar</AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonPrimary, loading && styles.actionButtonDisabled]}
          onPress={handleConfirm}
          activeOpacity={0.8}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldWrapper}>
      <AppText size="xs" color="secondary" style={styles.fieldLabel}>{label}</AppText>
      {children}
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
    padding: spacing[6],
    gap: spacing[5],
    paddingBottom: spacing[4],
  },
  fieldWrapper: {
    gap: spacing[1],
  },
  fieldLabel: {
    marginBottom: spacing[1],
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: spacing[3],
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
    opacity: 0.6,
  },
});
