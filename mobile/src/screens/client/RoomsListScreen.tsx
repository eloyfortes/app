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
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { roomsService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import BookingModal from '../../components/BookingModal';
import Card from '../../components/Card';
import { theme } from '../../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Room {
  id: string;
  name: string;
  size: string;
  tvs: number;
  projectors: number;
  capacity: number;
}

export default function RoomsListScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showFeatureFilter, setShowFeatureFilter] = useState(false);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [filters, setFilters] = useState({
    minCapacity: '',
    minTvs: '',
    minProjectors: '',
  });
  const [activeFilters, setActiveFilters] = useState({
    minCapacity: null as number | null,
    minTvs: null as number | null,
    minProjectors: null as number | null,
  });

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allRooms, activeFilters]);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const response = await roomsService.getAll();
      setAllRooms(response.data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as salas');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersToRooms = (roomsToFilter: Room[]) => {
    let filtered = [...roomsToFilter];

    if (activeFilters.minCapacity !== null) {
      filtered = filtered.filter(
        (room) => room.capacity >= activeFilters.minCapacity!
      );
    }

    if (activeFilters.minTvs !== null) {
      filtered = filtered.filter((room) => room.tvs >= activeFilters.minTvs!);
    }

    if (activeFilters.minProjectors !== null) {
      filtered = filtered.filter(
        (room) => room.projectors >= activeFilters.minProjectors!
      );
    }

    setRooms(filtered);
  };

  const applyFilters = () => {
    applyFiltersToRooms(allRooms);
  };

  const handleBookRoom = (room: Room) => {
    setSelectedRoom(room);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    setSelectedRoom(null);
    loadRooms();
  };

  const handleApplyFeatureFilter = () => {
    setActiveFilters({
      minCapacity: filters.minCapacity ? parseInt(filters.minCapacity) : null,
      minTvs: filters.minTvs ? parseInt(filters.minTvs) : null,
      minProjectors: filters.minProjectors ? parseInt(filters.minProjectors) : null,
    });
    setShowFeatureFilter(false);
  };

  const handleClearFeatureFilter = () => {
    setFilters({
      minCapacity: '',
      minTvs: '',
      minProjectors: '',
    });
    setActiveFilters({
      minCapacity: null,
      minTvs: null,
      minProjectors: null,
    });
  };

  const hasActiveFeatureFilters = () => {
    return (
      activeFilters.minCapacity !== null ||
      activeFilters.minTvs !== null ||
      activeFilters.minProjectors !== null
    );
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

  const renderRoom = ({ item }: { item: Room }) => (
    <Card>
      <View style={styles.roomHeader}>
        <View style={styles.roomHeaderLeft}>
          <Ionicons name="business" size={24} color={theme.colors.primary} />
          <Text style={styles.roomName}>{item.name}</Text>
        </View>
        <View style={styles.roomSizeBadge}>
          <Text style={styles.roomSizeText}>{item.size}</Text>
        </View>
      </View>

      <View style={styles.roomDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="people" size={18} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>{item.capacity} pessoas</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="tv" size={18} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>{item.tvs} TVs</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="videocam" size={18} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>{item.projectors} Projetores</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => handleBookRoom(item)}
        activeOpacity={0.7}
      >
        <Ionicons name="calendar-outline" size={20} color={theme.colors.textInverse} />
        <Text style={styles.bookButtonText}>Reservar sala</Text>
      </TouchableOpacity>
    </Card>
  );

  if (loading && rooms.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Simple Title */}
      <View style={[styles.simpleHeader, { paddingTop: Math.max(insets.top, 20) + theme.spacing.lg }]}>
        <Text style={styles.simpleHeaderTitle}>Salas disponíveis</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFeatureFilter(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {hasActiveFeatureFilters() && <View style={styles.filterBadge} />}
            <Ionicons
              name="filter"
              size={24}
              color={hasActiveFeatureFilters() ? theme.colors.primary : theme.colors.textSecondary}
            />
          </TouchableOpacity>
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

      {/* Active Filters */}
      {hasActiveFeatureFilters() && (
        <View style={styles.activeFiltersBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.activeFiltersContent}>
              {activeFilters.minCapacity !== null && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>Capacidade: ≥{activeFilters.minCapacity}</Text>
                </View>
              )}
              {activeFilters.minTvs !== null && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>TVs: ≥{activeFilters.minTvs}</Text>
                </View>
              )}
              {activeFilters.minProjectors !== null && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>Projetores: ≥{activeFilters.minProjectors}</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={handleClearFeatureFilter}
                activeOpacity={0.7}
              >
                <Text style={styles.clearFiltersText}>Limpar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Rooms List */}
      <FlatList
        data={rooms}
        renderItem={renderRoom}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadRooms}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={styles.emptyText}>
              {hasActiveFeatureFilters()
                ? 'Nenhuma sala encontrada com os filtros aplicados'
                : 'Nenhuma sala disponível'}
            </Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={showFeatureFilter}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFeatureFilter(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardView}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={[styles.modalContent, { height: SCREEN_HEIGHT * 0.9 - insets.top }]}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Filtrar salas</Text>
                    <TouchableOpacity
                      onPress={() => setShowFeatureFilter(false)}
                      activeOpacity={0.7}
                      style={styles.closeButton}
                    >
                      <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps="handled"
                    style={styles.modalScrollView}
                    contentContainerStyle={[styles.modalScrollContent, { paddingBottom: Math.max(insets.bottom + theme.spacing.lg, theme.spacing.xl) }]}
                  >
                    <View style={styles.filterSection}>
                      <Text style={styles.label}>Capacidade mínima</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ex: 10"
                        placeholderTextColor={theme.colors.textTertiary}
                        value={filters.minCapacity}
                        onChangeText={(text) =>
                          setFilters({ ...filters, minCapacity: text })
                        }
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.filterSection}>
                      <Text style={styles.label}>Quantidade mínima de TVs</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ex: 2"
                        placeholderTextColor={theme.colors.textTertiary}
                        value={filters.minTvs}
                        onChangeText={(text) =>
                          setFilters({ ...filters, minTvs: text })
                        }
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.filterSection}>
                      <Text style={styles.label}>Quantidade mínima de Projetores</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ex: 1"
                        placeholderTextColor={theme.colors.textTertiary}
                        value={filters.minProjectors}
                        onChangeText={(text) =>
                          setFilters({ ...filters, minProjectors: text })
                        }
                        keyboardType="numeric"
                      />
                    </View>
                  </ScrollView>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setShowFeatureFilter(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.applyButton]}
                      onPress={handleApplyFeatureFilter}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.applyButtonText}>Aplicar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Booking Modal */}
      {selectedRoom && (
        <BookingModal
          visible={showBookingModal}
          room={selectedRoom}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedRoom(null);
          }}
          onSuccess={handleBookingSuccess}
        />
      )}
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
  simpleHeader: {
    backgroundColor: theme.colors.backgroundSecondary,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  simpleHeaderTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  filterButton: {
    padding: theme.spacing.sm,
    position: 'relative',
  },
  logoutButton: {
    padding: theme.spacing.sm,
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  activeFiltersBar: {
    backgroundColor: theme.colors.backgroundSecondary,
    paddingVertical: theme.spacing.sm,
  },
  activeFiltersContent: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  filterChip: {
    backgroundColor: theme.colors.selected,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  filterChipText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  clearFiltersButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  clearFiltersText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  list: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  roomHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  roomName: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  roomSizeBadge: {
    backgroundColor: theme.colors.backgroundTertiary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  roomSizeText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  roomDetails: {
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  detailText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  bookButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  bookButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl * 2,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  filterSection: {
    padding: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  label: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.typography.bodyLarge,
    color: theme.colors.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButtonText: {
    ...theme.typography.button,
    color: theme.colors.textPrimary,
  },
  applyButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
});
