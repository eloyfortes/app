import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  type: ToastType;
  message: string;
  onHide: () => void;
  duration?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Toast({
  visible,
  type,
  message,
  onHide,
  duration = 3000,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hideToast = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  useEffect(() => {
    if (visible) {
      // Resetar animações
      slideAnim.setValue(-100);
      opacityAnim.setValue(0);
      
      // Pequeno delay para garantir que o Modal seja renderizado
      const showTimer = setTimeout(() => {
        // Mostrar toast
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, 50);

      // Auto esconder após duration
      hideTimeoutRef.current = setTimeout(() => {
        hideToast();
      }, duration + 50);

      return () => {
        clearTimeout(showTimer);
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
      };
    }
  }, [visible, duration]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'information-circle';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return theme.colors.warning;
      case 'info':
        return theme.colors.info;
      default:
        return theme.colors.primary;
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={hideToast}
      animationType="none"
      statusBarTranslucent
      hardwareAccelerated
      presentationStyle="overFullScreen"
    >
      <View style={styles.modalContainer} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.container,
            {
              top: Math.max(insets.top, 20) + theme.spacing.md,
              transform: [{ translateY: slideAnim }],
              opacity: opacityAnim,
            },
          ]}
          pointerEvents="box-none"
        >
          <View style={[styles.toast, { backgroundColor: getBackgroundColor() }]} pointerEvents="box-none">
            <View style={styles.toastContent} pointerEvents="auto">
              <Ionicons name={getIcon()} size={24} color={theme.colors.textInverse} />
              <Text style={styles.message}>{message}</Text>
              <TouchableOpacity
                onPress={hideToast}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={theme.colors.textInverse} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    pointerEvents: 'box-none',
    backgroundColor: 'transparent',
  },
  container: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
  },
  toast: {
    pointerEvents: 'box-none',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.large,
    gap: theme.spacing.sm,
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.textInverse,
    flex: 1,
    fontWeight: '500',
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
});
