import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { roomsService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface Room {
  id: string;
  name: string;
  size: string;
  tvs: number;
  projectors: number;
  capacity: number;
  active: boolean;
}

export default function RoomsScreen() {
  const insets = useSafeAreaInsets();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    size: '',
    tvs: '',
    projectors: '',
    capacity: '',
  });

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const response = await roomsService.getAll();
      setRooms(response.data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as salas');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = () => {
    setEditingRoom(null);
    setFormData({
      name: '',
      size: '',
      tvs: '',
      projectors: '',
      capacity: '',
    });
    setModalVisible(true);
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      size: room.size,
      tvs: room.tvs.toString(),
      projectors: room.projectors.toString(),
      capacity: room.capacity.toString(),
    });
    setModalVisible(true);
  };

  const handleSaveRoom = async () => {
    if (!formData.name || !formData.size || !formData.capacity) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const data = {
        name: formData.name,
        size: formData.size,
        tvs: parseInt(formData.tvs) || 0,
        projectors: parseInt(formData.projectors) || 0,
        capacity: parseInt(formData.capacity),
      };

      if (editingRoom) {
        await roomsService.update(editingRoom.id, data);
        Alert.alert('Sucesso', 'Sala atualizada com sucesso');
      } else {
        await roomsService.create(data);
        Alert.alert('Sucesso', 'Sala cadastrada com sucesso');
      }

      setModalVisible(false);
      loadRooms();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao salvar sala');
    }
  };

  const handleDeleteRoom = (room: Room) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja realmente excluir a sala "${room.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await roomsService.delete(room.id);
              Alert.alert('Sucesso', 'Sala excluída com sucesso');
              loadRooms();
            } catch (error) {
              Alert.alert('Erro', 'Erro ao excluir sala');
            }
          },
        },
      ]
    );
  };

  const renderRoom = ({ item }: { item: Room }) => (
    <View style={styles.roomCard}>
      <View style={styles.roomHeader}>
        <Text style={styles.roomName}>{item.name}</Text>
        <View style={styles.roomActions}>
          <TouchableOpacity onPress={() => handleEditRoom(item)} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteRoom(item)} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.roomDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="resize-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>Tamanho: {item.size}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="people-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>Capacidade: {item.capacity} pessoas</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="tv-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>TVs: {item.tvs}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="videocam-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>Projetores: {item.projectors}</Text>
        </View>
      </View>
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
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={handleAddRoom}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color={theme.colors.textInverse} />
        <Text style={styles.addButtonText}>Nova sala</Text>
      </TouchableOpacity>

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
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardView}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={[styles.modalContent, { maxHeight: '90%' }]}>
                  <Text style={styles.modalTitle}>
                    {editingRoom ? 'Editar Sala' : 'Nova Sala'}
                  </Text>

                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: theme.spacing.md }}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="Nome da Sala"
                      placeholderTextColor={theme.colors.textTertiary}
                      value={formData.name}
                      onChangeText={(text) => setFormData({ ...formData, name: text })}
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="Tamanho (ex: Pequena, Média, Grande)"
                      placeholderTextColor={theme.colors.textTertiary}
                      value={formData.size}
                      onChangeText={(text) => setFormData({ ...formData, size: text })}
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="Capacidade (número de pessoas)"
                      placeholderTextColor={theme.colors.textTertiary}
                      value={formData.capacity}
                      onChangeText={(text) => setFormData({ ...formData, capacity: text })}
                      keyboardType="numeric"
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="Quantidade de TVs"
                      placeholderTextColor={theme.colors.textTertiary}
                      value={formData.tvs}
                      onChangeText={(text) => setFormData({ ...formData, tvs: text })}
                      keyboardType="numeric"
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="Quantidade de Projetores"
                      placeholderTextColor={theme.colors.textTertiary}
                      value={formData.projectors}
                      onChangeText={(text) => setFormData({ ...formData, projectors: text })}
                      keyboardType="numeric"
                    />
                  </ScrollView>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.saveButton]}
                      onPress={handleSaveRoom}
                    >
                      <Text style={styles.saveButtonText}>Salvar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  addButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    margin: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    ...theme.shadows.medium,
  },
  addButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  roomCard: {
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
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  roomName: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  roomActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  roomDetails: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  detailText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.large,
  },
  modalTitle: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    color: theme.colors.textPrimary,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.typography.bodyLarge,
    color: theme.colors.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modalButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButtonText: {
    ...theme.typography.button,
    color: theme.colors.textPrimary,
  },
  saveButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
});
