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
import { bookingsService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  expectedDuration: number;
  status: 'PENDING' | 'APPROVED' | 'CANCELLED';
  room: {
    id: string;
    name: string;
    capacity: number;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

type BookingTab = 'PENDING' | 'APPROVED' | 'CANCELLED';

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BookingTab>('PENDING');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const response = await bookingsService.getAll();
      setBookings(response.data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as reservas');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId: string) => {
    Alert.alert('Aprovar Reserva', 'Deseja aprovar esta reserva?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Aprovar',
        onPress: async () => {
          try {
            await bookingsService.approve(bookingId);
            Alert.alert('Sucesso', 'Reserva aprovada com sucesso');
            loadBookings();
          } catch (error) {
            Alert.alert('Erro', 'Erro ao aprovar reserva');
          }
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
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

  const getStatusLabel = (status: string) => {
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

  const pendingBookings = bookings.filter((b) => b.status === 'PENDING');
  const approvedBookings = bookings.filter((b) => b.status === 'APPROVED');
  const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED');

  const filteredBookings = 
    activeTab === 'PENDING' ? pendingBookings :
    activeTab === 'APPROVED' ? approvedBookings :
    cancelledBookings;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'PENDING' && styles.tabActive]}
          onPress={() => setActiveTab('PENDING')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'PENDING' && styles.tabTextActive]}>
            Pendentes
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'APPROVED' && styles.tabActive]}
          onPress={() => setActiveTab('APPROVED')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'APPROVED' && styles.tabTextActive]}>
            Aprovados
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'CANCELLED' && styles.tabActive]}
          onPress={() => setActiveTab('CANCELLED')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'CANCELLED' && styles.tabTextActive]}>
            Cancelados
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredBookings}
        renderItem={({ item }) => (
          <View style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <Text style={styles.roomName}>{item.room.name}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { 
                    backgroundColor: `${getStatusColor(item.status)}40`,
                    borderWidth: 1,
                    borderColor: getStatusColor(item.status),
                  },
                ]}
              >
                <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
              </View>
            </View>

            <View style={styles.bookingDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.detailText}>{item.user.name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="mail-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.detailText}>{item.user.email}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.detailText}>
                  Início: {formatDate(item.startTime)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.detailText}>
                  Fim: {formatDate(item.endTime)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="hourglass-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.detailText}>
                  Duração: {item.expectedDuration} minutos
                </Text>
              </View>
            </View>

            {item.status === 'PENDING' && (
              <TouchableOpacity
                style={styles.approveButton}
                onPress={() => handleApprove(item.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.textInverse} />
                <Text style={styles.approveButtonText}>Aprovar reserva</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 20) + 80 }]}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={loadBookings}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={styles.emptyText}>
              {activeTab === 'PENDING' 
                ? 'Nenhuma reserva pendente'
                : activeTab === 'APPROVED'
                ? 'Nenhuma reserva aprovada'
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
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
    color: theme.colors.textTertiary,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: theme.colors.backgroundTertiary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeActive: {
    backgroundColor: theme.colors.primary,
  },
  tabBadgeText: {
    ...theme.typography.caption,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  tabBadgeTextActive: {
    color: theme.colors.textInverse,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  roomName: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    ...theme.typography.caption,
    color: theme.colors.textInverse,
    fontWeight: '600',
  },
  bookingDetails: {
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  detailText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  approveButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  approveButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
});
