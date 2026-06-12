import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './context/ThemeContext';
import { useNotifications } from './context/NotificationContext';

function FadeSlideIn({ children, delay = 0, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 400, delay, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

const typeIcons = {
  general: 'megaphone',
  exam: 'school',
  event: 'calendar',
  update: 'refresh',
  announcement: 'notifications',
};

const typeColors = {
  general: '#6B7280',
  exam: '#8B5CF6',
  event: '#3B82F6',
  update: '#10B981',
  announcement: '#F59E0B',
};

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
}

export default function Notifications() {
  const { isDark, theme } = useTheme();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }

  function handlePress(item) {
    if (!item.readBy?.length) markAsRead(item._id);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
            <Text style={[styles.markAllText, { color: theme.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={theme.textLight} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No notifications yet</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const isRead = item.readBy?.length > 0;
          return (
            <FadeSlideIn delay={index * 50}>
              <TouchableOpacity
                style={[styles.notifItem, { backgroundColor: isRead ? theme.surface : theme.surface + '80' }]}
                onPress={() => handlePress(item)}
              >
                <View style={[styles.notifIcon, { backgroundColor: (typeColors[item.type] || '#6B7280') + '20' }]}>
                  <Ionicons name={typeIcons[item.type] || 'megaphone'} size={20} color={typeColors[item.type] || '#6B7280'} />
                </View>
                <View style={styles.notifContent}>
                  <View style={styles.notifHeader}>
                    <Text style={[styles.notifTitle, { color: theme.text, fontWeight: isRead ? '500' : '700' }]}>{item.title}</Text>
                    {!isRead && <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />}
                  </View>
                  <Text style={[styles.notifMsg, { color: theme.textSecondary }]} numberOfLines={2}>{item.message}</Text>
                  <Text style={[styles.notifTime, { color: theme.textLight }]}>{formatTime(item.createdAt)}</Text>
                </View>
              </TouchableOpacity>
            </FadeSlideIn>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700' },
  markAllBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  markAllText: { fontSize: 13, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 32 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: 14 },
  notifItem: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, marginBottom: 10 },
  notifIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  notifTitle: { fontSize: 14, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  notifMsg: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  notifTime: { fontSize: 11 },
});
