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
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<BookingTab>('PENDING');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    resetAndLoad();
  }, [activeTab, selectedDate]);

  const resetAndLoad = async () => {
    setBookings([]);
    setCurrentPage(1);
    setLoading(true);
    await loadBookings(1, true);
  };

  const loadBookings = async (page: number = 1, reset: boolean = false) => {
    try {
      const dateString = selectedDate ? selectedDate.toISOString().split('T')[0] : undefined;
      const response = await bookingsService.getAll(dateString, activeTab, page, 10);
      
      const responseData = response.data;
      // O backend sempre retorna { data: [...], pagination: {...} }
      const bookingsData = Array.isArray(responseData?.data) 
        ? responseData.data 
        : Array.isArray(responseData) 
          ? responseData 
          : [];
      const pagination = responseData?.pagination;

      if (pagination) {
        setTotalPages(pagination.totalPages);
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
      Alert.alert('Erro', 'Não foi possível carregar as reservas');
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

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      if (date) {
        setSelectedDate(date);
        setShowDatePicker(false);
      } else {
        setShowDatePicker(false);
      }
    } else {
      // iOS: apenas atualiza a data temporária
      if (date) {
        setTempSelectedDate(date);
      }
    }
  };

  const handleConfirmDate = () => {
    if (tempSelectedDate) {
      setSelectedDate(tempSelectedDate);
    }
    setShowDatePicker(false);
  };

  const handleCancelDatePicker = () => {
    setTempSelectedDate(selectedDate);
    setShowDatePicker(false);
  };

  const handleClearDate = () => {
    setSelectedDate(null);
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
            resetAndLoad();
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

  const formatDateFilter = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
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

  // O filtro agora é feito no backend, então bookings já vem filtrado
  const filteredBookings = bookings;

  if (loading && bookings.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Date Filter */}
      <View style={styles.filterContainer}>
            <TouchableOpacity
              style={styles.dateFilterButton}
              onPress={() => {
                setTempSelectedDate(selectedDate);
                setShowDatePicker(true);
              }}
              activeOpacity={0.7}
            >
          <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.dateFilterText}>
            {selectedDate ? formatDateFilter(selectedDate) : 'Todas as datas'}
          </Text>
        </TouchableOpacity>
        {selectedDate && (
          <TouchableOpacity
            style={styles.clearDateButton}
            onPress={handleClearDate}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={20} color={theme.colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          transparent
          visible={showDatePicker}
          animationType="fade"
          onRequestClose={handleCancelDatePicker}
        >
          <TouchableOpacity
            style={styles.datePickerOverlay}
            activeOpacity={1}
            onPress={handleCancelDatePicker}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                  {Platform.OS === 'ios' && (
                    <View style={styles.datePickerContainer}>
                      <View style={styles.datePickerHeader}>
                        <TouchableOpacity onPress={handleCancelDatePicker}>
                          <Text style={styles.datePickerCancel}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleConfirmDate}>
                          <Text style={styles.datePickerConfirm}>Confirmar</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.datePickerWrapper}>
                        <DateTimePicker
                          value={tempSelectedDate || selectedDate || new Date()}
                          mode="date"
                          display="spinner"
                          onChange={handleDateChange}
                          minimumDate={new Date()}
                          themeVariant="light"
                          accentColor={theme.colors.primary}
                        />
                      </View>
                    </View>
                  )}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

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
          <Card>
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
          </Card>
        )}
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
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
    ...theme.shadows.small,
  },
  dateFilterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dateFilterText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  clearDateButton: {
    padding: theme.spacing.xs,
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  datePickerWrapper: {
    backgroundColor: theme.colors.backgroundSecondary,
  },
  datePickerCancel: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  datePickerConfirm: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.backgroundSecondary,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadows.small,
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
  list: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
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
  loadingMoreContainer: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
});
