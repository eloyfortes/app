import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { bookingsService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface Room {
  id: string;
  name: string;
  size: string;
  capacity: number;
}

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  expectedDuration: number;
  status: 'PENDING' | 'APPROVED' | 'CANCELLED';
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface RoomCalendarScreenProps {
  room: Room;
  visible: boolean;
  onClose: () => void;
}

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8:00 to 18:00

export default function RoomCalendarScreen({ room, visible, onClose }: RoomCalendarScreenProps) {
  const insets = useSafeAreaInsets();
  const { showError, showSuccess } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && room) {
      loadBookings();
    }
  }, [visible, room, selectedDate]);

  const loadBookings = async () => {
    if (!room) return;
    
    setLoading(true);
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      console.log('[RoomCalendar] Carregando bookings - roomId:', room.id, 'date:', dateString);
      const response = await bookingsService.getRoomBookings(room.id, dateString);
      console.log('[RoomCalendar] Resposta completa:', JSON.stringify(response, null, 2));
      console.log('[RoomCalendar] response.data:', response.data);
      console.log('[RoomCalendar] Tipo de response.data:', typeof response.data);
      console.log('[RoomCalendar] É array?', Array.isArray(response.data));
      const bookingsData = response.data || [];
      console.log('[RoomCalendar] Bookings carregados:', bookingsData.length, bookingsData);
      setBookings(bookingsData);
    } catch (error: any) {
      console.error('[RoomCalendar] Erro ao carregar reservas:', error);
      console.error('[RoomCalendar] Erro response:', error.response?.data);
      console.error('[RoomCalendar] Erro status:', error.response?.status);
      showError('Erro ao carregar reservas da sala');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (date) {
        setSelectedDate(date);
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

  const handleApprove = async (bookingId: string) => {
    Alert.alert(
      'Aprovar Reserva',
      'Deseja aprovar esta reserva?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprovar',
          onPress: async () => {
            try {
              await bookingsService.approve(bookingId);
              showSuccess('Reserva aprovada com sucesso');
              loadBookings();
            } catch (error: any) {
              showError(error.response?.data?.message || 'Erro ao aprovar reserva');
            }
          },
        },
      ]
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
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

  // Verifica se esta hora está ocupada por uma reserva (incluindo reservas que cruzam)
  const isHourOccupied = (hour: number): boolean => {
    const year = selectedDate.getUTCFullYear();
    const month = selectedDate.getUTCMonth();
    const day = selectedDate.getUTCDate();
    const hourStart = new Date(Date.UTC(year, month, day, hour, 0, 0, 0));
    const hourEnd = new Date(Date.UTC(year, month, day, hour + 1, 0, 0, 0));

    return bookings.some((booking) => {
      if (booking.status === 'CANCELLED') return false;
      const start = new Date(booking.startTime);
      const end = new Date(booking.endTime);
      return start < hourEnd && end > hourStart;
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.roomName}>{room.name}</Text>
            <TouchableOpacity
              onPress={() => {
                setTempSelectedDate(selectedDate);
                setShowDatePicker(true);
              }}
              style={styles.dateButton}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.calendarContainer}>
              {/* Container para reservas que cruzam múltiplas horas */}
              <View style={styles.bookingsOverlay}>
                {bookings
                  .filter((booking) => {
                    const notCancelled = booking.status !== 'CANCELLED';
                    console.log('[RoomCalendar] Booking filtrado:', booking.id, 'status:', booking.status, 'notCancelled:', notCancelled);
                    return notCancelled;
                  })
                  .map((booking) => {
                    const start = new Date(booking.startTime);
                    const end = new Date(booking.endTime);
                    // Criar dayStart usando UTC para evitar problemas de timezone
                    // Pegar apenas a data (ano, mês, dia) do selectedDate
                    const year = selectedDate.getUTCFullYear();
                    const month = selectedDate.getUTCMonth();
                    const day = selectedDate.getUTCDate();
                    const dayStart = new Date(Date.UTC(year, month, day, 8, 0, 0, 0));

                    console.log('[RoomCalendar] Renderizando booking:', booking.id);
                    console.log('[RoomCalendar] start:', start.toISOString(), 'end:', end.toISOString());
                    console.log('[RoomCalendar] selectedDate:', selectedDate.toISOString(), 'dayStart:', dayStart.toISOString());

                    const startMinutes = (start.getTime() - dayStart.getTime()) / (1000 * 60);
                    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

                    console.log('[RoomCalendar] startMinutes:', startMinutes, 'durationMinutes:', durationMinutes);

                    // Altura em pixels: cada hora tem 80px + 4px de margem (theme.spacing.xs)
                    const hourHeightPx = 80;
                    const marginBottomPx = 4;
                    
                    // Calcular a posição top considerando as margens entre as horas
                    const startHour = Math.floor(startMinutes / 60);
                    const startMinutesInHour = startMinutes % 60;
                    // O hourLabel tem paddingTop: 4, mas isso não afeta o alinhamento vertical das reservas
                    const topPx = (startHour * (hourHeightPx + marginBottomPx)) + (startMinutesInHour / 60) * hourHeightPx;
                    
                    // Calcular a altura total considerando as margens entre as horas
                    const totalHours = durationMinutes / 60;
                    const fullHours = Math.floor(totalHours);
                    const extraMinutes = (totalHours - fullHours) * 60;
                    const heightPx = (fullHours * (hourHeightPx + marginBottomPx)) + (extraMinutes / 60) * hourHeightPx - marginBottomPx;

                    console.log('[RoomCalendar] Posição calculada - topPx:', topPx, 'heightPx:', heightPx, 'startHour:', startHour);

                    return (
                      <TouchableOpacity
                        key={booking.id}
                        style={[
                          styles.bookingBlockAbsolute,
                          {
                            top: topPx,
                            height: heightPx,
                            backgroundColor:
                              booking.status === 'APPROVED'
                                ? theme.colors.primary + '20'
                                : theme.colors.warning + '20',
                            borderLeftColor:
                              booking.status === 'APPROVED'
                                ? theme.colors.primary
                                : theme.colors.warning,
                          },
                        ]}
                        onPress={() => booking.status === 'PENDING' && handleApprove(booking.id)}
                      >
                        <Text style={styles.bookingTime}>
                          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                        </Text>
                        <Text style={styles.bookingUser}>
                          {booking.user.name} - {booking.user.email}
                        </Text>
                        <Text style={styles.bookingDuration}>
                          {formatDuration(booking.expectedDuration)}
                        </Text>
                        {booking.status === 'PENDING' && (
                          <View style={styles.pendingBadge}>
                            <Text style={styles.pendingText}>Pendente</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
              </View>

              {/* Linhas de horas */}
              {HOURS.map((hour) => {
                const hourStart = new Date(selectedDate);
                hourStart.setHours(hour, 0, 0, 0);
                const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
                
                const isOccupied = isHourOccupied(hour);

                return (
                  <View key={hour} style={styles.hourRow}>
                    <View style={styles.hourLabel}>
                      <Text style={styles.hourText}>{hour}:00</Text>
                    </View>
                    <View style={styles.timeSlot}>
                      <View
                        style={[
                          styles.availableSlot,
                          { backgroundColor: isOccupied ? theme.colors.borderLight : theme.colors.backgroundTertiary },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}

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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.backgroundSecondary,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  closeButton: {
    padding: theme.spacing.sm,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  headerContent: {
    gap: theme.spacing.sm,
  },
  roomName: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  dateText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  calendarContainer: {
    padding: theme.spacing.lg,
    position: 'relative',
  },
  bookingsOverlay: {
    position: 'absolute',
    top: 25,
    left: 80 + theme.spacing.md, // width do hourLabel + marginLeft do timeSlot
    right: theme.spacing.lg,
    zIndex: 10,
    pointerEvents: 'box-none',
  },
  hourRow: {
    flexDirection: 'row',
    height: 80,
    marginBottom: theme.spacing.xs,
    zIndex: 1,
  },
  hourLabel: {
    width: 60,
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  hourText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },
  timeSlot: {
    flex: 1,
    position: 'relative',
    marginLeft: theme.spacing.md,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.borderLight,
  },
  availableSlot: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  bookingBlockAbsolute: {
    position: 'absolute',
    left: 1, // Alinhar com o conteúdo do timeSlot (após a borda de 1px)
    right: 0,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    minHeight: 50,
    ...theme.shadows.small,
  },
  bookingTime: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  bookingUser: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 20,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  bookingDuration: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 16,
    color: theme.colors.textTertiary,
  },
  pendingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginTop: 4,
  },
  pendingText: {
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 16,
    color: theme.colors.textInverse,
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
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },
  datePickerConfirm: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: theme.colors.primary,
  },
});
