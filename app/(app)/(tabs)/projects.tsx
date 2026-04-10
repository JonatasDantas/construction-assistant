import { View, StyleSheet } from 'react-native';
import { AppContainer } from '@/components/app-container';
import { ScreenHeader } from '@/components/screen-header';
import { AppText } from '@/components/app-text';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function ProjectsScreen() {
  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Meus Projetos"
        subtitle="3 obras ativas"
      />
      <AppContainer contentPadding>
        <AppText size="sm" color="secondary" style={styles.placeholder}>
          Lista de projetos aparecerá aqui — tela em migração.
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
