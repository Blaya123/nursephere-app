import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../constants/api';

const TOKEN_KEY = 'nursphere_token';

async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token) {
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export async function getStoredUser() {
  const data = await AsyncStorage.getItem('nursphere_user');
  return data ? JSON.parse(data) : null;
}

export async function setStoredUser(user) {
  if (user) {
    await AsyncStorage.setItem('nursphere_user', JSON.stringify(user));
  } else {
    await AsyncStorage.removeItem('nursphere_user');
  }
}

async function request(endpoint, options = {}) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const auth = {
  register: (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
};

export const userApi = {
  getProfile: () => request('/api/user/profile'),
  updateProfile: (body) => request('/api/user/profile', { method: 'PUT', body: JSON.stringify(body) }),
  getUsers: () => request('/api/user/all'),
  connect: (userId) => request('/api/user/connect', { method: 'POST', body: JSON.stringify({ userId }) }),
};

export const aiApi = {
  chat: (message, history = []) => request('/api/ai/chat', { method: 'POST', body: JSON.stringify({ message, history }) }),
  procedure: (name) => request('/api/ai/procedure', { method: 'POST', body: JSON.stringify({ name }) }),
  diagnosis: (symptoms) => request('/api/ai/diagnosis', { method: 'POST', body: JSON.stringify({ symptoms }) }),
  dailyInsights: () => request('/api/ai/daily-insights'),
  roadmap: () => request('/api/ai/roadmap'),
  careerInsight: () => request('/api/ai/career-insight'),
};

export const clinicalApi = {
  dosage: (body) => request('/api/clinical/dosage', { method: 'POST', body: JSON.stringify(body) }),
  dosageHistory: () => request('/api/clinical/dosage-history'),
};

export const chatApi = {
  getChannels: () => request('/api/chat/channels'),
  getMessages: (channel) => request(`/api/chat/messages/${channel}`),
  sendMessage: (body) => request('/api/chat/messages', { method: 'POST', body: JSON.stringify(body) }),
  addReaction: (messageId, emoji) => request('/api/chat/reaction', { method: 'POST', body: JSON.stringify({ messageId, emoji }) }),
  getSeedUsers: () => request('/api/chat/seed-users'),
};

export const statsApi = {
  track: (type, value = 1) => request('/api/stats/track', { method: 'POST', body: JSON.stringify({ type, value }) }),
  get: () => request('/api/stats'),
};

export const drugsApi = {
  getAll: (search) => request(`/api/drugs${search ? `?search=${search}` : ''}`),
  getByName: (name) => request(`/api/drugs/${name}`),
};
