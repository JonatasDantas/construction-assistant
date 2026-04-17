import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { AppText } from './app-text';

interface StatsCardProps {
  records: number;
  hours: string;
  people: number;
}

export function StatsCard({ records, hours, people }: StatsCardProps) {
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <TrendingUp size={20} color={colors.textInverse} />
        <AppText size="base" weight="semibold" color="inverse">
          Resumo desta semana
        </AppText>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <AppText size="2xl" weight="bold" color="inverse">
            {String(records)}
          </AppText>
          <AppText size="xs" color="inverse" style={styles.statLabel}>
            Registros
          </AppText>
        </View>
        <View style={styles.statItem}>
          <AppText size="2xl" weight="bold" color="inverse">
            {hours}
          </AppText>
          <AppText size="xs" color="inverse" style={styles.statLabel}>
            Trabalhadas
          </AppText>
        </View>
        <View style={styles.statItem}>
          <AppText size="2xl" weight="bold" color="inverse">
            {String(people)}
          </AppText>
          <AppText size="xs" color="inverse" style={styles.statLabel}>
            Pessoas
          </AppText>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    padding: spacing[5],
    marginBottom: spacing[6],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  stats: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    opacity: 0.8,
    marginTop: spacing[1],
  },
});
