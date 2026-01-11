import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { roomsService, bookingsService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

export default function AdminDashboardScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState({
    totalRooms: 0,
    totalBookings: 0,
    activeBookings: 0,
    pendingBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        roomsService.getAll(),
        bookingsService.getAll(),
      ]);

      const activeBookings = bookingsRes.data.filter(
        (b: any) => b.status === 'APPROVED'
      ).length;
      const pendingBookings = bookingsRes.data.filter(
        (b: any) => b.status === 'PENDING'
      ).length;

      setStats({
        totalRooms: roomsRes.data.length,
        totalBookings: bookingsRes.data.length,
        activeBookings,
        pendingBookings,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading && stats.totalRooms === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 80 }}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={loadStats}
          tintColor={theme.colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerContent, { paddingTop: Math.max(insets.top, 20) + theme.spacing.lg }]}>
          <View>
            <Text style={styles.welcomeText}>Bem-vindo de volta</Text>
            <Text style={styles.nameText}>{user?.name}</Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="log-out-outline" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Visão Geral</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.infoLight }]}>
              <Ionicons name="business" size={24} color={theme.colors.info} />
            </View>
            <Text style={styles.statNumber}>{stats.totalRooms}</Text>
            <Text style={styles.statLabel}>Salas</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.warningLight }]}>
              <Ionicons name="time" size={24} color={theme.colors.warning} />
            </View>
            <Text style={styles.statNumber}>{stats.pendingBookings}</Text>
            <Text style={styles.statLabel}>Pendentes</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.successLight }]}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
            </View>
            <Text style={styles.statNumber}>{stats.activeBookings}</Text>
            <Text style={styles.statLabel}>Ativas</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.secondaryLight }]}>
              <Ionicons name="calendar" size={24} color={theme.colors.secondary} />
            </View>
            <Text style={styles.statNumber}>{stats.totalBookings}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <View style={styles.actionsList}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Salas')}
            activeOpacity={0.7}
          >
            <View style={styles.actionCardContent}>
              <View style={styles.actionCardIcon}>
                <Ionicons name="business-outline" size={28} color={theme.colors.primary} />
              </View>
              <View style={styles.actionCardText}>
                <Text style={styles.actionCardTitle}>Gerenciar Salas</Text>
                <Text style={styles.actionCardSubtitle}>Criar, editar ou excluir salas</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.textTertiary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Usuários')}
            activeOpacity={0.7}
          >
            <View style={styles.actionCardContent}>
              <View style={styles.actionCardIcon}>
                <Ionicons name="people-outline" size={28} color={theme.colors.primary} />
              </View>
              <View style={styles.actionCardText}>
                <Text style={styles.actionCardTitle}>Gerenciar Usuários</Text>
                <Text style={styles.actionCardSubtitle}>Aprovar ou visualizar usuários</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.textTertiary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Reservas')}
            activeOpacity={0.7}
          >
            <View style={styles.actionCardContent}>
              <View style={styles.actionCardIcon}>
                <Ionicons name="calendar-outline" size={28} color={theme.colors.primary} />
              </View>
              <View style={styles.actionCardText}>
                <Text style={styles.actionCardTitle}>Todas as Reservas</Text>
                <Text style={styles.actionCardSubtitle}>Visualizar e aprovar reservas</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.textTertiary} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  welcomeText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  nameText: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  logoutButton: {
    padding: theme.spacing.sm,
  },
  statsSection: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    width: '48%',
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  statNumber: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  actionsSection: {
    padding: theme.spacing.lg,
    paddingTop: 0,
    paddingBottom: theme.spacing.xxl,
  },
  actionsList: {
    gap: theme.spacing.md,
  },
  actionCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  actionCardIcon: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  actionCardText: {
    flex: 1,
  },
  actionCardTitle: {
    ...theme.typography.bodyLarge,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  actionCardSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
});
