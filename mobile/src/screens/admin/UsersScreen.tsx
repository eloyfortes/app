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
import { usersService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import Card from '../../components/Card';
import { useToast } from '../../contexts/ToastContext';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CLIENT' | 'CLIENT_PREMIUM';
  approved: boolean;
  createdAt: string;
}

type TabType = 'pending' | 'approved';

export default function UsersScreen() {
  const insets = useSafeAreaInsets();
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('pending');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await usersService.getAll();
      setUsers(response.data);
    } catch (error) {
      showError('Não foi possível carregar os usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string, userName: string) => {
    Alert.alert(
      'Aprovar Usuário',
      `Deseja aprovar o cadastro de "${userName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprovar',
          onPress: async () => {
            try {
              await usersService.approve(userId);
              showSuccess('Usuário aprovado com sucesso');
              loadUsers();
            } catch (error: any) {
              showError(error.response?.data?.message || 'Erro ao aprovar usuário');
            }
          },
        },
      ]
    );
  };

  const handlePromoteToPremium = async (userId: string, userName: string) => {
    Alert.alert(
      'Promover para Premium',
      `Deseja promover "${userName}" para cliente premium?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Promover',
          onPress: async () => {
            try {
              await usersService.promoteToPremium(userId);
              showSuccess('Usuário promovido para premium com sucesso');
              loadUsers();
            } catch (error: any) {
              showError(error.response?.data?.message || 'Erro ao promover usuário');
            }
          },
        },
      ]
    );
  };

  const renderUser = ({ item }: { item: User }) => (
    <Card style={styles.userCardContent}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.userMeta}>
          {item.role === 'ADMIN' && (
            <View style={[styles.badge, styles.adminBadge]}>
              <Text style={styles.badgeText}>ADMIN</Text>
            </View>
          )}
          {item.role === 'CLIENT_PREMIUM' && (
            <View style={[styles.badge, styles.premiumBadge]}>
              <Text style={styles.badgeText}>Premium</Text>
            </View>
          )}
          {item.approved ? (
            <View style={[styles.badge, styles.approvedBadge]}>
              <Text style={styles.badgeText}>Aprovado</Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.pendingBadge]}>
              <Text style={styles.badgeText}>Pendente</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.userActions}>
        {!item.approved && (
          <TouchableOpacity
            style={styles.approveButton}
            onPress={() => handleApprove(item.id, item.name)}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.textInverse} />
            <Text style={styles.approveButtonText}>Aprovar</Text>
          </TouchableOpacity>
        )}
        {item.approved && item.role === 'CLIENT' && (
          <TouchableOpacity
            style={styles.promoteButton}
            onPress={() => handlePromoteToPremium(item.id, item.name)}
            activeOpacity={0.7}
          >
            <Text style={styles.promoteButtonText}>Promover Premium</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  const pendingUsers = users.filter((u) => !u.approved);
  const approvedUsers = users.filter((u) => u.approved);
  const currentUsers = activeTab === 'pending' ? pendingUsers : approvedUsers;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Pendentes
          </Text>
          {pendingUsers.length > 0 && (
            <View style={[styles.tabBadge, activeTab === 'pending' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'pending' && styles.tabBadgeTextActive]}>
                {pendingUsers.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'approved' && styles.tabActive]}
          onPress={() => setActiveTab('approved')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'approved' && styles.tabTextActive]}>
            Aprovados
          </Text>
          {approvedUsers.length > 0 && (
            <View style={[styles.tabBadge, activeTab === 'approved' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'approved' && styles.tabBadgeTextActive]}>
                {approvedUsers.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Lista de usuários */}
      <FlatList
        data={currentUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 20) + 80 }]}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={loadUsers}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={styles.emptyText}>
              {activeTab === 'pending' 
                ? 'Nenhum usuário pendente' 
                : 'Nenhum usuário aprovado'}
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
    fontSize: 11,
  },
  tabBadgeTextActive: {
    color: theme.colors.textInverse,
  },
  list: {
    padding: theme.spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  userCardContent: {
    flexDirection: 'column',
    gap: theme.spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '300',
    color: theme.colors.textPrimary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
    fontWeight: '300',
    letterSpacing: 0.3,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 10,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
  },
  adminBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  clientBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  premiumBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  approvedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  pendingBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  badgeText: {
    color: theme.colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  userActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  approveButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
  promoteButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.textTertiary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
  },
  promoteButtonText: {
    ...theme.typography.body,
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
});
