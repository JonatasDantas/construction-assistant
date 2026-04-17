import { Tabs } from 'expo-router';
import { Home, FileText, FolderOpen } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNavTab } from '@/components/bottom-nav-tab';
import { AppText } from '@/components/app-text';
import { colors } from '@/theme/colors';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarButton: BottomNavTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
          tabBarLabel: ({ color }) => (
            <AppText size="xs" weight="medium" style={{ color }}>
              Início
            </AppText>
          ),
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Relatório',
          tabBarIcon: ({ color }) => <FileText size={20} color={color} />,
          tabBarLabel: ({ color }) => (
            <AppText size="xs" weight="medium" style={{ color }}>
              Relatório
            </AppText>
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projetos',
          tabBarIcon: ({ color }) => <FolderOpen size={20} color={color} />,
          tabBarLabel: ({ color }) => (
            <AppText size="xs" weight="medium" style={{ color }}>
              Projetos
            </AppText>
          ),
        }}
      />
    </Tabs>
  );
}
