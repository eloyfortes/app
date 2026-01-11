import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { bookingsService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import Card from '../../components/Card';

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  expectedDuration: number;
  status: 'PENDING' | 'APPROVED' | 'CANCELLED';
  room: {
    id: string;
    name: string;
    size: string;
    capacity: number;
  };
}

type BookingTab = 'APPROVED' | 'PENDING' | 'CANCELLED';

export default function MyBookingsScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<BookingTab>('APPROVED');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const isPremium = user?.role === 'CLIENT_PREMIUM';

  useEffect(() => {
    resetAndLoad();
  }, [activeTab]);

  const resetAndLoad = async () => {
    setBookings([]);
    setCurrentPage(1);
    setLoading(true);
    await loadBookings(1, true);
  };

  const loadBookings = async (page: number = 1, reset: boolean = false) => {
    try {
      const response = await bookingsService.getAll(undefined, activeTab, page, 10);
      
      const responseData = response.data;
      // O backend sempre retorna { data: [...], pagination: {...} }
      const bookingsData = Array.isArray(responseData?.data) 
        ? responseData.data 
        : Array.isArray(responseData) 
          ? responseData 
          : [];
      const pagination = responseData?.pagination;

      if (pagination) {
        setHasMore(page < pagination.totalPages);
      } else {
        setHasMore(false);
      }

      if (reset) {
        setBookings(bookingsData);
      } else {
        setBookings((prev) => [...prev, ...bookingsData]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar suas reservas');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = async () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      await loadBookings(nextPage, false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    Alert.alert(
      'Cancelar Reserva',
      'Deseja realmente cancelar esta reserva?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingsService.cancel(bookingId);
              Alert.alert('Sucesso', 'Reserva cancelada com sucesso');
              resetAndLoad();
            } catch (error: any) {
              Alert.alert(
                'Erro',
                error.response?.data?.message || 'Erro ao cancelar reserva'
              );
            }
          },
        },
      ]
    );
  };

  const formatTimeOnly = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateOnly = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes === 60) return '1h';
    if (minutes === 90) return '1h30';
    if (minutes === 120) return '2h';
    if (minutes === 150) return '2h30';
    if (minutes === 180) return '3h';
    return `${minutes}min`;
  };

  const isCompleted = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    return end < now;
  };

  const getStatusColor = (status: string, endTime: string) => {
    if (status === 'APPROVED' && isCompleted(endTime)) {
      return theme.colors.secondary;
    }
    switch (status) {
      case 'APPROVED':
        return theme.colors.success;
      case 'PENDING':
        return theme.colors.warning;
      case 'CANCELLED':
        return theme.colors.error;
      default:
        return theme.colors.textTertiary;
    }
  };

  const getStatusLabel = (status: string, endTime: string) => {
    if (status === 'APPROVED' && isCompleted(endTime)) {
      return 'Concluída';
    }
    switch (status) {
      case 'APPROVED':
        return 'Aprovada';
      case 'PENDING':
        return 'Pendente';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const canCancel = (status: string, endTime: string) => {
    if (isCompleted(endTime)) {
      return false;
    }
    return status === 'PENDING' || status === 'APPROVED';
  };

  const handleLogout = async () => {
    Alert.alert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const getTabOptions = (): Array<{ value: BookingTab; label: string }> => {
    const tabs: Array<{ value: BookingTab; label: string }> = [
      { value: 'APPROVED', label: 'Aprovadas' },
    ];
    
    if (!isPremium) {
      tabs.push({ value: 'PENDING', label: 'Pendente' });
    }
    
    tabs.push({ value: 'CANCELLED', label: 'Canceladas' });
    
    return tabs;
  };

  // O filtro agora é feito no backend, então bookings já vem filtrado
  const filteredBookings = bookings;

  const renderBooking = ({ item }: { item: Booking }) => (
    <Card style={styles.bookingCard}>
      {/* Header com Sala */}
      <View style={styles.cardHeader}>
        <View style={styles.salaContainer}>
          <Text style={styles.salaLabel}>SALA</Text>
          <Text style={styles.salaName}>{item.room.name}</Text>
        </View>
      </View>

      {/* Informações principais - Início, Fim e Duração */}
      <View style={styles.bookingInfo}>
        <View style={styles.infoRow}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Início</Text>
            <View style={styles.infoValueRow}>
              <Text style={styles.infoValue}>{formatTimeOnly(item.startTime)}</Text>
              <Text style={styles.infoDate}>{formatDateOnly(item.startTime)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="time" size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Fim</Text>
            <View style={styles.infoValueRow}>
              <Text style={styles.infoValue}>{formatTimeOnly(item.endTime)}</Text>
              <Text style={styles.infoDate}>{formatDateOnly(item.endTime)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="hourglass-outline" size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Duração</Text>
            <Text style={styles.infoValue}>{formatDuration(item.expectedDuration)}</Text>
          </View>
        </View>
      </View>

      {/* Botão Cancelar (se aplicável) */}
      {canCancel(item.status, item.endTime) && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancel(item.id)}
          activeOpacity={0.8}
        >
          <Ionicons name="close-circle-outline" size={20} color={theme.colors.error} />
          <Text style={styles.cancelButtonText}>Cancelar reserva</Text>
        </TouchableOpacity>
      )}
    </Card>
  );

  if (loading && bookings.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.headerContent, { paddingTop: Math.max(insets.top, 20) + theme.spacing.lg }]}>
          <View>
            <Text style={styles.welcomeText}>Bem-vindo de volta</Text>
            <Text style={styles.nameText}>{user?.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="log-out-outline" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {getTabOptions().map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, activeTab === tab.value && styles.tabActive]}
            onPress={() => setActiveTab(tab.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab.value && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredBookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 20) + 80 }]}
        refreshControl={
          <RefreshControl 
            refreshing={loading && bookings.length === 0} 
            onRefresh={resetAndLoad}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={styles.emptyText}>
              {activeTab === 'APPROVED' 
                ? 'Nenhuma reserva aprovada'
                : activeTab === 'PENDING'
                ? 'Nenhuma reserva pendente'
                : 'Nenhuma reserva cancelada'}
            </Text>
          </View>
        }
      />
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
  header: {
    backgroundColor: theme.colors.backgroundSecondary,
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
  list: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  bookingCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  salaContainer: {
    flex: 1,
  },
  salaLabel: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  salaName: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  bookingInfo: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  infoContent: {
    flex: 1,
    minWidth: 0,
  },
  infoLabel: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  infoValue: {
    ...theme.typography.bodyLarge,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
  infoDate: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  cancelButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: theme.colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  cancelButtonText: {
    ...theme.typography.button,
    color: theme.colors.error,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyText: {
    marginTop: 24,
    fontSize: 18,
    color: theme.colors.textTertiary,
    fontWeight: '300',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.backgroundSecondary,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadows.small,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: theme.spacing.sm,
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    ...theme.typography.bodyLarge,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  loadingMoreContainer: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
});
