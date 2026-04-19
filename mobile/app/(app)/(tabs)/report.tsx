import { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Share2, RefreshCw } from 'lucide-react-native';
import { AppText } from '@/components/app-text';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { useProject } from '@/context/project-context';
import { generateReport } from '@/utils/reports-api';

type Status = 'idle' | 'generating' | 'preview' | 'error';

function getTodayLabel(): string {
  return new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ReportScreen() {
  const { activeProject } = useProject();
  const todayLabel = getTodayLabel();

  const [status, setStatus] = useState<Status>('idle');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (activeProject) {
      handleGeneratePdf();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProject?.id]);

  async function handleGeneratePdf() {
    if (!activeProject) return;
    setStatus('generating');
    setErrorMsg(null);
    try {
      const result = await generateReport(activeProject.id);
      setPdfUrl(result.pdfUrl);
      setStatus('preview');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao gerar relatório');
      setStatus('error');
    }
  }

  async function handleShare() {
    if (!pdfUrl) return;
    setSharing(true);
    try {
      const localUri = (FileSystem.documentDirectory ?? '') + 'relatorio.pdf';
      const { uri } = await FileSystem.downloadAsync(pdfUrl, localUri);
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartilhar Relatório',
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível compartilhar o relatório.');
    } finally {
      setSharing(false);
    }
  }

  const canShare = status === 'preview' && !sharing;

  // Android can't render PDFs directly in WebView — use Google Docs viewer
  const webViewUri =
    pdfUrl && Platform.OS === 'android'
      ? `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(pdfUrl)}`
      : (pdfUrl ?? '');

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Relatório Diário"
        subtitle={todayLabel}
        action={
          <TouchableOpacity hitSlop={8} onPress={handleShare} disabled={!canShare}>
            <Share2 size={20} color={canShare ? colors.textSecondary : colors.border} />
          </TouchableOpacity>
        }
      />

      {status === 'generating' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText size="sm" color="secondary" style={styles.loadingText}>
            Gerando relatório...
          </AppText>
        </View>
      )}

      {status === 'preview' && pdfUrl && (
        <WebView
          source={{ uri: webViewUri }}
          style={styles.webview}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        />
      )}

      {status === 'error' && (
        <View style={styles.centered}>
          <AppText size="base" color="secondary" style={styles.errorText}>
            {errorMsg ?? 'Erro ao gerar relatório'}
          </AppText>
          <TouchableOpacity style={styles.retryButton} onPress={handleGeneratePdf}>
            <RefreshCw size={16} color={colors.primary} />
            <AppText size="base" weight="medium" color="brand">
              Tentar novamente
            </AppText>
          </TouchableOpacity>
        </View>
      )}

      {status === 'idle' && (
        <View style={styles.centered}>
          {!activeProject ? (
            <AppText size="base" color="secondary" style={styles.errorText}>
              Selecione um projeto para gerar o relatório.
            </AppText>
          ) : (
            <TouchableOpacity style={styles.generateButton} onPress={handleGeneratePdf}>
              <AppText size="base" weight="medium" color="inverse">
                Gerar PDF
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webview: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    gap: spacing[4],
  },
  loadingText: {
    marginTop: spacing[2],
  },
  errorText: {
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  generateButton: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[8],
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
  },
});
