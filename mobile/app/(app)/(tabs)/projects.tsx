import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Plus } from 'lucide-react-native';
import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { projects } from '@/data/mock-data';
import { useProject } from '@/context/project-context';

export default function ProjectsScreen() {
  const router = useRouter();
  const { setActiveProject } = useProject();

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Meus Projetos"
        subtitle={`${projects.length} obras ativas`}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {projects.map((project) => (
          <TouchableOpacity
            key={project.id}
            activeOpacity={0.8}
            onPress={() => {
              setActiveProject(project.id);
              router.navigate('/(app)/(tabs)');
            }}
          >
            <Card shadow="sm" radius="xl">
              <View style={styles.cardContent}>
                <View style={[styles.colorSwatch, { backgroundColor: project.color }]} />
                <View style={styles.projectInfo}>
                  <AppText size="base" weight="medium" numberOfLines={2}>
                    {project.name}
                  </AppText>
                  <View style={styles.locationRow}>
                    <MapPin size={14} color={colors.textSecondary} />
                    <AppText size="sm" color="secondary" numberOfLines={1} style={styles.locationText}>
                      {project.location}
                    </AppText>
                  </View>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        {/* Nova Obra */}
        {/* TODO: open new project creation flow when implemented */}
        <TouchableOpacity style={styles.newProjectButton} activeOpacity={0.7} onPress={() => {}}>
          <Plus size={20} color={colors.textSecondary} />
          <AppText size="base" weight="medium" color="secondary">
            Nova Obra
          </AppText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
    gap: spacing[3],
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    padding: spacing[4],
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    flexShrink: 0,
  },
  projectInfo: {
    flex: 1,
    gap: spacing[1],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  locationText: {
    flex: 1,
  },
  newProjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingVertical: spacing[4],
    backgroundColor: colors.surface,
  },
});
