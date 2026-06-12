import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Animated, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './context/ThemeContext';
import { useSocket } from './context/SocketContext';
import { chatApi } from '../services/api';

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

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
}

export default function Messages() {
  const { isDark, theme } = useTheme();
  const socket = useSocket();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('active');

  useFocusEffect(useCallback(() => { loadConversations(); }, []));

  useEffect(() => {
    if (!socket) return;
    function handleNewDM() { loadConversations(); }
    function handleAccepted() { loadConversations(); }
    socket.on('dm:new', handleNewDM);
    socket.on('friend:accepted', handleAccepted);
    return () => { socket.off('dm:new', handleNewDM); socket.off('friend:accepted', handleAccepted); };
  }, [socket]);

  async function loadConversations() {
    try {
      const data = await chatApi.getConversations();
      setConversations(data || []);
    } catch {}
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }

  async function handleAccept(convId) {
    try {
      await chatApi.acceptConversation(convId);
      loadConversations();
    } catch { Alert.alert('Error', 'Could not accept request'); }
  }

  async function handleReject(convId) {
    try {
      await chatApi.rejectConversation(convId);
      loadConversations();
    } catch { Alert.alert('Error', 'Could not reject request'); }
  }

  function getInitials(name) {
    return name?.split(' ').map(n => n.charAt(0)).join('').toUpperCase() || '?';
  }

  const pendingItems = conversations.filter(c => c.status === 'pending');
  const activeItems = conversations.filter(c => c.status === 'active');

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Messages</Text>
      </View>

      {pendingItems.length > 0 && (
        <View style={[styles.tabRow, { borderBottomColor: theme.border }]}>
          <TouchableOpacity style={[styles.tab, tab === 'active' && { borderBottomWidth: 2, borderBottomColor: theme.primary }]} onPress={() => setTab('active')}>
            <Text style={[styles.tabText, { color: tab === 'active' ? theme.primary : theme.textSecondary }]}>Chats ({activeItems.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'pending' && { borderBottomWidth: 2, borderBottomColor: theme.warning }]} onPress={() => setTab('pending')}>
            <Text style={[styles.tabText, { color: tab === 'pending' ? theme.warning : theme.textSecondary }]}>Requests ({pendingItems.length})</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={tab === 'pending' ? pendingItems : activeItems}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={48} color={theme.textLight} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {tab === 'pending' ? 'No pending requests' : 'No messages yet'}
            </Text>
            <Text style={[styles.emptySub, { color: theme.textLight }]}>
              {tab === 'pending' ? '' : 'Tap a user to start a conversation'}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <FadeSlideIn delay={index * 50}>
            <View style={[styles.convoItem, { backgroundColor: theme.surface }]}>
              <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
                <Text style={[styles.avatarText, { color: theme.primary }]}>{getInitials(item.other?.name)}</Text>
              </View>
              <View style={styles.convoContent}>
                <View style={styles.convoHeader}>
                  <Text style={[styles.convoName, { color: theme.text }]} numberOfLines={1}>{item.other?.name || 'Unknown'}</Text>
                  <Text style={[styles.convoTime, { color: theme.textLight }]}>{formatTime(item.lastTime)}</Text>
                </View>
                <View style={styles.convoMeta}>
                  <Text style={[styles.convoRole, { color: theme.textSecondary }]} numberOfLines={1}>{item.other?.role || ''}</Text>
                </View>
                {item.status === 'pending' ? (
                  <View style={styles.pendingActions}>
                    <Text style={[styles.pendingLabel, { color: theme.warning }]}>Wants to connect with you</Text>
                    <View style={styles.pendingBtns}>
                      <TouchableOpacity style={[styles.acceptBtn, { backgroundColor: theme.success }]} onPress={() => handleAccept(item._id)}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                        <Text style={styles.btnLabel}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.rejectBtn, { backgroundColor: theme.error }]} onPress={() => handleReject(item._id)}>
                        <Ionicons name="close" size={16} color="#fff" />
                        <Text style={styles.btnLabel}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View>
                    {item.lastMessage ? (
                      <Text style={[styles.convoPreview, { color: theme.textLight }]} numberOfLines={1}>{item.lastMessage}</Text>
                    ) : null}
                    <TouchableOpacity
                      style={[styles.openChatBtn, { backgroundColor: theme.primary }]}
                      onPress={() => router.push({ pathname: '/dm-chat', params: { conversationId: item._id, otherName: item.other?.name || 'Chat', otherUserId: item.other?._id } })}
                    >
                      <Ionicons name="chatbubble" size={12} color="#fff" />
                      <Text style={styles.openChatText}>Open Chat</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </FadeSlideIn>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  tabRow: { flexDirection: 'row', borderBottomWidth: 0.5 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 32 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600' },
  emptySub: { fontSize: 13 },
  convoItem: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, marginBottom: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700' },
  convoContent: { flex: 1 },
  convoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  convoName: { fontSize: 15, fontWeight: '600', flex: 1 },
  convoTime: { fontSize: 11 },
  convoMeta: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  convoRole: { fontSize: 12 },
  convoPreview: { fontSize: 13, marginTop: 2 },
  pendingActions: { marginTop: 6 },
  pendingLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  pendingBtns: { flexDirection: 'row', gap: 8 },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  rejectBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  btnLabel: { color: '#fff', fontSize: 12, fontWeight: '600' },
  openChatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
  openChatText: { color: '#fff', fontSize: 11, fontWeight: '600' },
});
