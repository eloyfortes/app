import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bookingsService, roomsService } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Room {
  id: string;
  name: string;
  size: string;
  tvs: number;
  projectors: number;
  capacity: number;
}

interface BookingModalProps {
  visible: boolean;
  room: Room;
  onClose: () => void;
  onSuccess: () => void;
}

type BookingStep = 'day' | 'time' | 'duration' | 'customDate';

const DURATION_OPTIONS = [
  { value: 60, label: '1 hora' },
  { value: 90, label: '1 hora e 30 minutos' },
  { value: 120, label: '2 horas' },
  { value: 150, label: '2 horas e 30 minutos' },
  { value: 180, label: '3 horas' },
];

// Gerar horários disponíveis de 8h até 18h em slots de 30 minutos
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let hour = 8; hour < 18; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export default function BookingModal({
  visible,
  room,
  onClose,
  onSuccess,
}: BookingModalProps) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentStep, setCurrentStep] = useState<BookingStep>('day');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Resetar quando o modal fechar
  useEffect(() => {
    if (!visible) {
      setCurrentStep('day');
      setSelectedDay(null);
      setSelectedTime(null);
      setSelectedDuration(null);
      setAvailableSlots([]);
    }
  }, [visible]);

  // Quando selecionar um dia, buscar horários disponíveis
  useEffect(() => {
    if (selectedDay && currentStep === 'time') {
      checkAvailableSlots();
    }
  }, [selectedDay, currentStep]);

  const checkAvailableSlots = async () => {
    if (!selectedDay) return;

    setCheckingAvailability(true);
    try {
      // Buscar horários ocupados da sala no dia selecionado
      const selectedDayOnly = new Date(selectedDay);
      selectedDayOnly.setHours(0, 0, 0, 0);
      
      const occupiedResponse = await bookingsService.getOccupiedTimeSlots(
        room.id,
        selectedDayOnly.toISOString()
      );
      const occupiedBookings = occupiedResponse.data;

      // Criar um conjunto de horários ocupados (em slots de 30 min)
      const occupiedSlots = new Set<string>();
      
      occupiedBookings.forEach((booking: any) => {
        const start = new Date(booking.startTime);
        const end = new Date(booking.endTime);
        
        // Gerar todos os slots de 30 min ocupados (excluindo o horário de término)
        // Se a reserva vai de 8:00 até 11:00, os slots ocupados são: 08:00, 08:30, 09:00, 09:30, 10:00, 10:30
        // O slot 11:00 NÃO está ocupado, pois é quando a reserva termina
        let current = new Date(start);
        while (current < end) {
          const hours = current.getHours();
          const minutes = current.getMinutes();
          const slotKey = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          occupiedSlots.add(slotKey);
          
          // Avançar 30 minutos
          current.setMinutes(current.getMinutes() + 30);
          
          // Se o próximo slot seria >= end, parar (não incluir o horário de término)
          if (current >= end) {
            break;
          }
        }
      });

      // Filtrar slots que já passaram (se for hoje) e que não estão ocupados
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDayOnlyCompare = new Date(selectedDay);
      selectedDayOnlyCompare.setHours(0, 0, 0, 0);

      const available = TIME_SLOTS.filter(slot => {
        // Verificar se o slot não está ocupado
        if (occupiedSlots.has(slot)) {
          return false;
        }

        // Filtrar slots que já passaram (se for hoje)
        if (selectedDayOnlyCompare.getTime() === today.getTime()) {
          const [hours, minutes] = slot.split(':').map(Number);
          const slotTime = new Date();
          slotTime.setHours(hours, minutes, 0, 0);
          slotTime.setMinutes(slotTime.getMinutes() - 30);
          return slotTime > now;
        }
        return true;
      });

      setAvailableSlots(available);
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      // Em caso de erro, mostrar todos os slots (validação será feita no backend)
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDayOnly = new Date(selectedDay);
      selectedDayOnly.setHours(0, 0, 0, 0);

      const available = TIME_SLOTS.filter(slot => {
        if (selectedDayOnly.getTime() === today.getTime()) {
          const [hours, minutes] = slot.split(':').map(Number);
          const slotTime = new Date();
          slotTime.setHours(hours, minutes, 0, 0);
          slotTime.setMinutes(slotTime.getMinutes() - 30);
          return slotTime > now;
        }
        return true;
      });
      setAvailableSlots(available);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const getDayOptions = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return [
      { 
        date: today, 
        label: 'Hoje', 
        subtitle: today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      },
      { 
        date: tomorrow, 
        label: 'Amanhã', 
        subtitle: tomorrow.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      },
    ];
  };

  const handleDaySelect = (date: Date) => {
    setSelectedDay(date);
    setCurrentStep('time');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setCurrentStep('duration');
  };

  const handleDurationSelect = (duration: number) => {
    setSelectedDuration(duration);
    // Scroll para o final após um pequeno delay para garantir que o estado foi atualizado
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleConfirm = async () => {
    if (!selectedDay || !selectedTime || !selectedDuration) {
      Alert.alert('Campos obrigatórios', 'Selecione dia, horário e duração');
      return;
    }

    // Criar data de início combinando dia e horário
    const startDateTime = new Date(selectedDay);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    startDateTime.setHours(hours, minutes, 0, 0);

    // Criar data de fim adicionando a duração
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + selectedDuration);

    // Validar que não está no passado
    if (startDateTime < new Date()) {
      Alert.alert('Erro', 'Não é possível agendar no passado');
      return;
    }

    setLoading(true);
    try {
      await bookingsService.create({
        roomId: room.id,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        expectedDuration: selectedDuration,
      });
      onSuccess();
      setCurrentStep('day');
      setSelectedDay(null);
      setSelectedTime(null);
      setSelectedDuration(null);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        'Erro ao criar reserva. Verifique se você já não possui uma reserva ativa.';
      Alert.alert('Erro ao reservar', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isCustomDateSelected = () => {
    if (!selectedDay) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const selected = new Date(selectedDay);
    selected.setHours(0, 0, 0, 0);
    
    return (
      selected.getTime() !== today.getTime() &&
      selected.getTime() !== tomorrow.getTime()
    );
  };

  const formatDayLabel = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) return 'Hoje';
    if (dateOnly.getTime() === today.getTime() + 86400000) return 'Amanhã';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  };

  const renderDaySelection = () => {
    const dayOptions = getDayOptions();

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Selecione o dia</Text>
        <View style={styles.optionsList}>
          {dayOptions.map((option, index) => {
            const isSelected = selectedDay?.getTime() === option.date.getTime();
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayOption,
                  isSelected && styles.dayOptionSelected,
                ]}
                onPress={() => handleDaySelect(option.date)}
                activeOpacity={0.7}
              >
                <View style={styles.dayOptionContent}>
                  <Text
                    style={[
                      styles.dayOptionLabel,
                      isSelected && styles.dayOptionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.dayOptionSubtitle,
                      isSelected && styles.dayOptionSubtitleSelected,
                    ]}
                  >
                    {option.subtitle}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
          
          <TouchableOpacity
            style={[
              styles.dayOption,
              styles.customDateOption,
              isCustomDateSelected() && styles.dayOptionSelected,
            ]}
            onPress={() => {
              Keyboard.dismiss();
              setCurrentStep('customDate');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.dayOptionContent}>
              <Ionicons 
                name="calendar-outline" 
                size={20} 
                color={isCustomDateSelected() ? theme.colors.primary : theme.colors.textSecondary} 
                style={styles.customDateIcon}
              />
              <View style={styles.customDateTextContainer}>
                <Text
                  style={[
                    styles.dayOptionLabel,
                    isCustomDateSelected() && styles.dayOptionLabelSelected,
                  ]}
                >
                  {isCustomDateSelected() && selectedDay 
                    ? selectedDay.toLocaleDateString('pt-BR', { weekday: 'long' })
                    : 'Escolher data'}
                </Text>
                {isCustomDateSelected() && selectedDay && (
                  <Text
                    style={[
                      styles.dayOptionSubtitle,
                      styles.dayOptionSubtitleSelected,
                    ]}
                  >
                    {selectedDay.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </Text>
                )}
              </View>
            </View>
            {isCustomDateSelected() && (
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTimeSelection = () => {
    if (checkingAvailability) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Verificando disponibilidade...</Text>
        </View>
      );
    }

    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <TouchableOpacity onPress={() => setCurrentStep('day')} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.stepHeaderText}>
            <Text style={styles.stepTitle}>
              {selectedDay ? formatDayLabel(selectedDay) : 'Selecione o horário'}
            </Text>
            <Text style={styles.stepSubtitle}>Horários disponíveis das 8h às 18h</Text>
          </View>
        </View>

        <View style={styles.timeSlotsGrid}>
          {availableSlots.map((slot, index) => {
            const isSelected = selectedTime === slot;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.timeSlot, isSelected && styles.timeSlotSelected]}
                onPress={() => handleTimeSelect(slot)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    isSelected && styles.timeSlotTextSelected,
                  ]}
                >
                  {slot}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const getNext30Days = () => {
    const days: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

  const formatDateOption = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    
    if (dateOnly.getTime() === today.getTime()) {
      return { label: 'Hoje', subtitle: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) };
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    if (dateOnly.getTime() === tomorrow.getTime()) {
      return { label: 'Amanhã', subtitle: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) };
    }
    
    const dayOfWeek = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    const dayAndMonth = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    
    return { 
      label: dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1), 
      subtitle: dayAndMonth 
    };
  };

  const renderCustomDateSelection = () => {
    const availableDates = getNext30Days();
    const selectedDateOnly = selectedDay ? new Date(selectedDay) : null;
    if (selectedDateOnly) {
      selectedDateOnly.setHours(0, 0, 0, 0);
    }

    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <TouchableOpacity onPress={() => setCurrentStep('day')} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.stepHeaderText}>
            <Text style={styles.stepTitle}>Escolher Data</Text>
            <Text style={styles.stepSubtitle}>Próximos 30 dias</Text>
          </View>
        </View>

        <ScrollView 
          style={styles.datesScrollView}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.datesScrollContent}
        >
          <View style={styles.datesList}>
            {availableDates.map((date, index) => {
              const dateOnly = new Date(date);
              dateOnly.setHours(0, 0, 0, 0);
              const isSelected = selectedDateOnly && dateOnly.getTime() === selectedDateOnly.getTime();
              const dateOption = formatDateOption(date);
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.dateOptionItem, isSelected && styles.dateOptionItemSelected]}
                  onPress={() => {
                    handleDaySelect(date);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.dateOptionContent}>
                    <Text style={[styles.dateOptionLabel, isSelected && styles.dateOptionLabelSelected]}>
                      {dateOption.label}
                    </Text>
                    <Text style={[styles.dateOptionSubtitle, isSelected && styles.dateOptionSubtitleSelected]}>
                      {dateOption.subtitle}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderDurationSelection = () => {
    // Filtrar durações baseado no horário selecionado (sistema fecha às 18:00)
    const getAvailableDurations = () => {
      if (!selectedTime) return DURATION_OPTIONS;

      const [hours, minutes] = selectedTime.split(':').map(Number);
      const closingTime = 18 * 60; // 18:00 em minutos
      const startTimeMinutes = hours * 60 + minutes; // Horário de início em minutos

      return DURATION_OPTIONS.filter(option => {
        const endTimeMinutes = startTimeMinutes + option.value;
        return endTimeMinutes <= closingTime;
      });
    };

    const availableDurations = getAvailableDurations();

    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <TouchableOpacity onPress={() => setCurrentStep('time')} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.stepHeaderText}>
            <Text style={styles.stepTitle}>Selecione a duração</Text>
            <Text style={styles.stepSubtitle}>
              {selectedDay && formatDayLabel(selectedDay)} às {selectedTime}
            </Text>
          </View>
        </View>

        {availableDurations.length === 0 ? (
          <View style={styles.emptyDurationContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.colors.warning} />
            <Text style={styles.emptyDurationText}>
              Não há durações disponíveis para este horário
            </Text>
            <Text style={styles.emptyDurationSubtext}>
              O sistema fecha às 18:00. Selecione um horário anterior.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.optionsList}>
              {availableDurations.map((option, index) => {
                const isSelected = selectedDuration === option.value;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.durationOption, isSelected && styles.durationOptionSelected]}
                    onPress={() => handleDurationSelect(option.value)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.durationOptionContent}>
                      <Ionicons
                        name="time-outline"
                        size={20}
                        color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.durationOptionText,
                          isSelected && styles.durationOptionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedDuration && (
              <TouchableOpacity
                style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
                onPress={handleConfirm}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.textInverse} />
                ) : (
                  <>
                    <Text style={styles.confirmButtonText}>Confirmar reserva</Text>
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.textInverse} />
                  </>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <View style={[styles.modalContent, { height: SCREEN_HEIGHT * 0.92 - insets.top }]} onStartShouldSetResponder={() => true}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <Ionicons name="calendar" size={24} color={theme.colors.primary} />
                  <View>
                    <Text style={styles.modalTitle}>Reservar sala</Text>
                    <Text style={styles.roomName}>{room.name}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Step Indicator */}
              <View style={styles.stepIndicator}>
                <View style={styles.stepIndicatorItem}>
                  <View style={[styles.stepDot, currentStep === 'day' && styles.stepDotActive]} />
                  <Text style={[styles.stepIndicatorText, currentStep === 'day' && styles.stepIndicatorTextActive]}>
                    Dia
                  </Text>
                </View>
                <View style={styles.stepIndicatorLine} />
                <View style={styles.stepIndicatorItem}>
                  <View style={[styles.stepDot, currentStep === 'time' && styles.stepDotActive]} />
                  <Text style={[styles.stepIndicatorText, currentStep === 'time' && styles.stepIndicatorTextActive]}>
                    Horário
                  </Text>
                </View>
                <View style={styles.stepIndicatorLine} />
                <View style={styles.stepIndicatorItem}>
                  <View style={[styles.stepDot, currentStep === 'duration' && styles.stepDotActive]} />
                  <Text
                    style={[styles.stepIndicatorText, currentStep === 'duration' && styles.stepIndicatorTextActive]}
                  >
                    Duração
                  </Text>
                </View>
              </View>

              {/* Content */}
              <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={true}
                style={styles.contentScroll}
                contentContainerStyle={[styles.contentScrollContent, { paddingBottom: Math.max(insets.bottom + theme.spacing.lg, theme.spacing.xl) }]}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
                onScrollBeginDrag={Keyboard.dismiss}
              >
                {currentStep === 'day' && renderDaySelection()}
                {currentStep === 'customDate' && renderCustomDateSelection()}
                {currentStep === 'time' && renderTimeSelection()}
                {currentStep === 'duration' && renderDurationSelection()}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    borderWidth: 0,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    width: '100%',
    ...theme.shadows.large,
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollContent: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  roomName: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  stepIndicatorItem: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.backgroundTertiary,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  stepIndicatorText: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    fontSize: 10,
  },
  stepIndicatorTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  stepIndicatorLine: {
    flex: 1,
    height: 2,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.sm,
  },
  stepContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  stepHeaderText: {
    flex: 1,
  },
  stepTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  stepSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  optionsList: {
    gap: theme.spacing.md,
  },
  dayOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.small,
  },
  dayOptionSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: theme.colors.selected,
  },
  dayOptionContent: {
    flex: 1,
  },
  dayOptionLabel: {
    ...theme.typography.bodyLarge,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  dayOptionLabelSelected: {
    color: theme.colors.primary,
  },
  dayOptionSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  dayOptionSubtitleSelected: {
    color: theme.colors.textPrimary,
  },
  customDateOption: {
    marginTop: theme.spacing.sm,
  },
  customDateIcon: {
    marginRight: theme.spacing.md,
  },
  customDateTextContainer: {
    flex: 1,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  timeSlot: {
    width: '22%',
    aspectRatio: 1.5,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.small,
  },
  timeSlotSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: theme.colors.selected,
  },
  timeSlotText: {
    ...theme.typography.bodyLarge,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  timeSlotTextSelected: {
    color: theme.colors.primary,
  },
  durationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.small,
  },
  durationOptionSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: theme.colors.selected,
  },
  durationOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  durationOptionText: {
    ...theme.typography.bodyLarge,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  durationOptionTextSelected: {
    color: theme.colors.primary,
  },
  emptyDurationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyDurationText: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  emptyDurationSubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md + 2,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
  datesScrollView: {
    flex: 1,
  },
  datesScrollContent: {
    paddingBottom: theme.spacing.lg,
  },
  datesList: {
    gap: theme.spacing.sm,
  },
  dateOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  dateOptionItemSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: theme.colors.selected,
  },
  dateOptionContent: {
    flex: 1,
  },
  dateOptionLabel: {
    ...theme.typography.bodyLarge,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  dateOptionLabelSelected: {
    color: theme.colors.primary,
  },
  dateOptionSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  dateOptionSubtitleSelected: {
    color: theme.colors.textPrimary,
  },
});
