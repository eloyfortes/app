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

      // O backend agora retorna { data: [...], pagination: {...} }
      const responseData = bookingsRes.data;
      const bookingsData = Array.isArray(responseData?.data) 
        ? responseData.data 
        : Array.isArray(responseData) 
          ? responseData 
          : [];
      
      const activeBookings = bookingsData.filter(
        (b: any) => b.status === 'APPROVED'
      ).length;
      const pendingBookings = bookingsData.filter(
        (b: any) => b.status === 'PENDING'
      ).length;

      setStats({
        totalRooms: roomsRes.data.length,
        totalBookings: bookingsData.length,
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

  const statCards = [
    {
      label: 'Salas',
      value: stats.totalRooms,
      icon: 'business',
      iconBg: theme.colors.primary + '15',
      iconColor: theme.colors.primary,
    },
    {
      label: 'Pendentes',
      value: stats.pendingBookings,
      icon: 'time',
      iconBg: theme.colors.warning + '15',
      iconColor: theme.colors.warning,
    },
    {
      label: 'Ativas',
      value: stats.activeBookings,
      icon: 'checkmark-circle',
      iconBg: theme.colors.success + '15',
      iconColor: theme.colors.success,
    },
    {
      label: 'Total',
      value: stats.totalBookings,
      icon: 'calendar',
      iconBg: theme.colors.info + '15',
      iconColor: theme.colors.info,
    },
  ];

  const quickActions = [
    {
      title: 'Gerenciar Salas',
      subtitle: 'Criar, editar ou excluir salas',
      icon: 'business-outline',
      screen: 'Salas',
      iconBg: theme.colors.primary + '15',
      iconColor: theme.colors.primary,
    },
    {
      title: 'Gerenciar Usuários',
      subtitle: 'Aprovar ou visualizar usuários',
      icon: 'people-outline',
      screen: 'Usuários',
      iconBg: theme.colors.info + '15',
      iconColor: theme.colors.info,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 100 }}
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
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + theme.spacing.lg }]}>
          <View style={styles.headerContent}>
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
            {statCards.map((stat, index) => (
              <View
                key={index}
                style={styles.statCardContainer}
              >
                <View style={styles.statCard}>
                  <View style={[styles.statIconContainer, { backgroundColor: stat.iconBg }]}>
                    <Ionicons name={stat.icon as any} size={28} color={stat.iconColor} />
                  </View>
                  <Text style={styles.statNumber}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <View style={styles.actionsList}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionCard}
                onPress={() => navigation.navigate(action.screen)}
                activeOpacity={0.7}
              >
                <View style={styles.actionCardContent}>
                  <View style={[styles.actionIconContainer, { backgroundColor: action.iconBg }]}>
                    <Ionicons name={action.icon as any} size={24} color={action.iconColor} />
                  </View>
                  <View style={styles.actionCardText}>
                    <Text style={styles.actionCardTitle}>{action.title}</Text>
                    <Text style={styles.actionCardSubtitle}>{action.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: theme.colors.backgroundSecondary,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  welcomeText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  nameText: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsSection: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCardContainer: {
    width: '48%',
    marginBottom: theme.spacing.md,
  },
  statCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    minHeight: 120,
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  statIconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  statNumber: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    fontWeight: '700',
  },
  statLabel: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  actionsSection: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  actionsList: {
    gap: theme.spacing.md,
  },
  actionCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.medium,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  actionCardText: {
    flex: 1,
  },
  actionCardTitle: {
    ...theme.typography.bodyLarge,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  actionCardSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
});
