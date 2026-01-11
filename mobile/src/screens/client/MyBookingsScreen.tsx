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

export default function MyBookingsScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const response = await bookingsService.getAll();
      setBookings(response.data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar suas reservas');
    } finally {
      setLoading(false);
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
              loadBookings();
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
        return 'Aguardando Aprovação';
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

  const renderBooking = ({ item }: { item: Booking }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <Text style={styles.roomName}>{item.room.name}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status, item.endTime) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusLabel(item.status, item.endTime)}</Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="resize-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>Tamanho: {item.room.size}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>
            Capacidade: {item.room.capacity} pessoas
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>
            Início: {formatDate(item.startTime)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>Fim: {formatDate(item.endTime)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="hourglass-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>
            Duração esperada: {item.expectedDuration} minutos
          </Text>
        </View>
      </View>

      {canCancel(item.status, item.endTime) && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancel(item.id)}
          activeOpacity={0.8}
        >
          <Ionicons name="close-circle" size={20} color={theme.colors.error} />
          <Text style={styles.cancelButtonText}>Cancelar reserva</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
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

      <FlatList
        data={bookings}
        renderItem={renderBooking}
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
            <Text style={styles.emptyText}>Você ainda não fez nenhuma reserva</Text>
            <Text style={styles.emptySubtext}>
              Navegue até a aba "Salas" para agendar uma sala
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
    backgroundColor: theme.colors.backgroundSecondary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
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
    letterSpacing: 1,
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
  cancelButton: {
    backgroundColor: theme.colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: theme.colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  cancelButtonText: {
    ...theme.typography.button,
    color: theme.colors.error,
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
  emptySubtext: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    fontWeight: '300',
    letterSpacing: 0.3,
  },
});
