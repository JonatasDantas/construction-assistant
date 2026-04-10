import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Share2 } from 'lucide-react-native';
import { AppContainer } from '@/components/app-container';
import { ScreenHeader } from '@/components/screen-header';
import { AppText } from '@/components/app-text';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function ReportScreen() {
  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Relatório Diário"
        subtitle="10 de abril de 2026"
        action={
          <TouchableOpacity hitSlop={8}>
            <Share2 size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        }
      />
      <AppContainer contentPadding>
        <AppText size="sm" color="secondary" style={styles.placeholder}>
          Relatório aparecerá aqui — tela em migração.
        </AppText>
      </AppContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  placeholder: {
    textAlign: 'center',
    marginTop: spacing[8],
  },
});
