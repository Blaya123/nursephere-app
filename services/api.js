import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../constants/api';

const TOKEN_KEY = 'nursphere_token';

export async function getToken() {
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

  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, { ...options, headers });
  const textBody = await res.text();

  let data;
  try {
    data = JSON.parse(textBody);
  } catch {
    throw new Error(`Server error (${res.status}) at ${url}: ${textBody.substring(0, 150)}`);
  }

  if (!res.ok) {
    throw new Error(`Server error (${res.status}) at ${url}: ${data.error || textBody.substring(0, 100)}`);
  }
  return data;
}

export const auth = {
  sendOTP: (body) => request('/api/auth/send-otp', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  verifyOTP: (body) => request('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify(body) }),
  resendOTP: (body) => request('/api/auth/resend-otp', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  forgotPassword: (body) => request('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }),
  resetPassword: (body) => request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
  changePassword: (body) => request('/api/auth/change-password', { method: 'PUT', body: JSON.stringify(body) }),
};

export const userApi = {
  getProfile: () => request('/api/user/profile'),
  updateProfile: (body) => request('/api/user/profile', { method: 'PUT', body: JSON.stringify(body) }),
  getUsers: () => request('/api/user/all'),
  connect: (userId) => request('/api/user/connect', { method: 'POST', body: JSON.stringify({ userId }) }),
  getConnections: () => request('/api/user/connections'),
  getUserById: (id) => request(`/api/user/${id}`),
  removeConnection: (userId) => request('/api/user/remove-connection', { method: 'POST', body: JSON.stringify({ userId }) }),
  blockUser: (userId) => request('/api/user/block', { method: 'POST', body: JSON.stringify({ userId }) }),
  unblockUser: (userId) => request('/api/user/unblock', { method: 'POST', body: JSON.stringify({ userId }) }),
  getBlockedUsers: () => request('/api/user/blocked'),
};

export const aiApi = {
  chat: (message, history = [], sessionId) => request('/api/ai/chat', { method: 'POST', body: JSON.stringify({ message, history, sessionId }) }),
  getHistory: () => request('/api/ai/history'),
  getSession: (id) => request(`/api/ai/history/${id}`),
  deleteSession: (id) => request(`/api/ai/history/${id}`, { method: 'DELETE' }),
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
  getConversations: () => request('/api/chat/conversations'),
  getOrCreateConversation: (otherUserId) => request('/api/chat/conversations', { method: 'POST', body: JSON.stringify({ otherUserId }) }),
  getDMMessages: (conversationId) => request(`/api/chat/conversations/${conversationId}/messages`),
  sendDMMessage: (conversationId, text) => request(`/api/chat/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ text }) }),
  getUnreadCount: () => request('/api/chat/unread-count'),
  deleteMessage: (conversationId, messageId) => request(`/api/chat/conversations/${conversationId}/messages/${messageId}`, { method: 'DELETE' }),
  acceptConversation: (conversationId) => request(`/api/chat/conversations/${conversationId}/accept`, { method: 'PUT' }),
  rejectConversation: (conversationId) => request(`/api/chat/conversations/${conversationId}/reject`, { method: 'PUT' }),
};

export const statsApi = {
  track: (type, value = 1) => request('/api/stats/track', { method: 'POST', body: JSON.stringify({ type, value }) }),
  get: () => request('/api/stats'),
};

export const drugsApi = {
  getAll: (search) => request(`/api/drugs${search ? `?search=${search}` : ''}`),
  getByName: (name) => request(`/api/drugs/${name}`),
};

export const apApi = {
  get: () => request('/api/ap'),
  getProgrammes: () => request('/api/ap/programmes'),
};

export const notificationsApi = {
  get: () => request('/api/notifications'),
  markRead: (id) => request(`/api/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request('/api/notifications/read-all', { method: 'PUT' }),
};

export const newsApi = {
  get: () => request('/api/news'),
};

export const adminApi = {
  dashboard: () => request('/api/admin/dashboard'),
  users: (params) => request(`/api/admin/users?${new URLSearchParams(params || {})}`),
  userDetail: (id) => request(`/api/admin/users/${id}`),
  deleteUser: (id) => request(`/api/admin/users/${id}`, { method: 'DELETE' }),
  broadcastNotification: (body) => request('/api/admin/notifications/broadcast', { method: 'POST', body: JSON.stringify(body) }),
};
