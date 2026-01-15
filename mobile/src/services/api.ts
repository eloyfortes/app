import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Altere para o IP da sua máquina no desenvolvimento
// Exemplo: const API_URL = 'http://192.168.1.100:3000';
const API_URL = 'http://192.168.15.16:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token nas requisições
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@sphaus:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['@sphaus:token', '@sphaus:user']);
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
};

export const usersService = {
  getAll: () => api.get('/users'),
  approve: (id: string) => api.patch(`/users/${id}/approve`),
  promoteToPremium: (id: string) => api.patch(`/users/${id}/promote-premium`),
};

export const roomsService = {
  getAll: (startTime?: string, endTime?: string) => {
    const params = startTime && endTime ? { startTime, endTime } : {};
    return api.get('/rooms', { params });
  },
  getById: (id: string) => api.get(`/rooms/${id}`),
  create: (data: any) => api.post('/rooms', data),
  update: (id: string, data: any) => api.patch(`/rooms/${id}`, data),
  delete: (id: string) => api.delete(`/rooms/${id}`),
};

export const bookingsService = {
  getAll: (date?: string, status?: string, page?: number, limit?: number, showCompleted?: boolean) => {
    const params: any = {};
    if (date) params.date = date;
    if (status) params.status = status;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    if (showCompleted !== undefined) params.showCompleted = showCompleted.toString();
    return api.get('/bookings', { params });
  },
  getById: (id: string) => api.get(`/bookings/${id}`),
  create: (data: any) => api.post('/bookings', data),
  cancel: (id: string) => api.patch(`/bookings/${id}/cancel`),
  approve: (id: string) => api.patch(`/bookings/${id}/approve`),
  getOccupiedTimeSlots: (roomId: string, date: string) => 
    api.get(`/bookings/room/${roomId}/occupied-slots`, { params: { date } }),
  getRoomBookings: (roomId: string, date?: string) => {
    const params: any = {};
    if (date) params.date = date;
    return api.get(`/bookings/room/${roomId}/bookings`, { params });
  },
};

export default api;
