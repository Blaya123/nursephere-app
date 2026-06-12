import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Keyboard, Platform, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './context/ThemeContext';
import { useSocket } from './context/SocketContext';
import { chatApi, getStoredUser } from '../services/api';

export default function DMChat() {
  const { isDark, theme } = useTheme();
  const { conversationId: paramConvId, otherName, otherUserId } = useLocalSearchParams();
  const socket = useSocket();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState(paramConvId || null);
  const [sending, setSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [userId, setUserId] = useState(null);
  const [convStatus, setConvStatus] = useState('active');
  const flatListRef = useRef(null);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => { getStoredUser().then(u => u && setUserId(u._id)); }, []);

  useEffect(() => { setupChat(); }, []);

  useEffect(() => {
    if (!socket || !userId || !conversationId) return;
    function handleNewMessage(data) {
      if (data.userId !== userId) return;
      if (data.message?.conversationId !== conversationId) return;
      setMessages(prev => {
        if (prev.some(m => m._id === data.message._id)) return prev;
        return [...prev, data.message];
      });
    }
    function handleAccepted(data) {
      if (data?.userId === userId) setConvStatus('active');
    }
    socket.on('dm:new', handleNewMessage);
    socket.on('friend:accepted', handleAccepted);
    return () => { socket.off('dm:new', handleNewMessage); socket.off('friend:accepted', handleAccepted); };
  }, [socket, userId, conversationId]);

  async function setupChat() {
    if (conversationId) {
      try {
        const convs = await chatApi.getConversations();
        const current = convs?.find(c => c._id === conversationId);
        if (current?.status) setConvStatus(current.status);
      } catch {}
      await loadMessages();
      return;
    }
    if (otherUserId) {
      try {
        const conv = await chatApi.getOrCreateConversation(otherUserId);
        setConversationId(conv._id);
        setConvStatus(conv.status || 'pending');
        setLoading(false);
        const data = await chatApi.getDMMessages(conv._id);
        setMessages(data || []);
        return;
      } catch (err) {
        console.log('Chat setup error:', err.message);
      }
    }
    setLoading(false);
  }

  async function loadMessages() {
    if (!conversationId) { setLoading(false); return; }
    try {
      const data = await chatApi.getDMMessages(conversationId);
      setMessages(data || []);
    } catch (err) {
      console.log('Load messages error:', err.message);
    }
    setLoading(false);
  }

  async function sendMessage() {
    if (!input.trim() || sending || !conversationId) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    const tempId = Date.now().toString();
    setMessages(prev => [...prev, { _id: tempId, text, userName: 'You', createdAt: new Date().toISOString(), temp: true }]);
    try {
      const msg = await chatApi.sendDMMessage(conversationId, text);
      setMessages(prev => prev.map(m => m._id === tempId ? msg : m));
    } catch (err) {
      setMessages(prev => prev.map(m => m._id === tempId ? { ...m, failed: true } : m));
    }
    setSending(false);
  }

  async function handleDeleteMessage(messageId) {
    if (!conversationId) return;
    try {
      await chatApi.deleteMessage(conversationId, messageId);
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, text: '[deleted]', deleted: true } : m));
    } catch { Alert.alert('Error', 'Could not delete message'); }
  }

  function confirmDelete(msgId) {
    Alert.alert('Delete Message', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => handleDeleteMessage(msgId) },
    ]);
  }

  function formatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

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
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>{otherName || 'Chat'}</Text>
          {convStatus === 'pending' && (
            <Text style={[styles.statusBadge, { color: theme.warning }]}>Pending · Awaiting approval</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => router.push({ pathname: '/user-profile', params: { userId: otherUserId || '' } })} style={styles.profileBtn}>
          <Ionicons name="person-circle-outline" size={26} color={theme.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.messagesList}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Ionicons name="chatbubbles-outline" size={40} color={theme.textLight} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {convStatus === 'pending' ? 'Request sent. Waiting for approval...' : 'Send a message to start chatting'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.deleted) {
            return (
              <View style={[styles.messageRow, styles.centerRow]}>
                <Text style={[styles.deletedText, { color: theme.textLight }]}>Message deleted</Text>
              </View>
            );
          }
          const isMine = item.userId === userId || item.userName === 'You';
          return (
            <TouchableOpacity
              activeOpacity={isMine ? 0.6 : 1}
              onLongPress={isMine ? () => confirmDelete(item._id) : undefined}
              style={[styles.messageRow, isMine ? styles.myRow : styles.theirRow]}
            >
              <View style={[styles.messageBubble, isMine ? { backgroundColor: theme.primary } : { backgroundColor: theme.surfaceAlt }]}>
                <Text style={[styles.messageText, { color: isMine ? '#fff' : theme.text }]}>{item.text}</Text>
                <View style={styles.messageFooter}>
                  <Text style={[styles.messageTime, { color: isMine ? 'rgba(255,255,255,0.6)' : theme.textLight }]}>{formatTime(item.createdAt)}</Text>
                  {isMine && item.failed && <Ionicons name="alert-circle" size={12} color={theme.error} style={{ marginLeft: 4 }} />}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {!conversationId ? (
        <View style={[styles.noConvBar, { backgroundColor: theme.surfaceAlt, borderTopColor: theme.border }]}>
          <Text style={[styles.noConvText, { color: theme.textSecondary }]}>Could not start conversation</Text>
        </View>
      ) : (
        <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: Platform.OS === 'android' ? keyboardHeight + 8 : 8 }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]}
            placeholder="Type a message..."
            placeholderTextColor={theme.textLight}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme.primary }]} onPress={sendMessage} disabled={sending || !input.trim()}>
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  statusBadge: { fontSize: 11, marginTop: 2 },
  profileBtn: { padding: 4 },
  messagesList: { padding: 16, paddingBottom: 8 },
  emptyChat: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  messageRow: { marginBottom: 10, maxWidth: '85%' },
  myRow: { alignSelf: 'flex-end' },
  theirRow: { alignSelf: 'flex-start' },
  centerRow: { alignSelf: 'center' },
  messageBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  messageText: { fontSize: 15, lineHeight: 21 },
  messageFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4, alignSelf: 'flex-end' },
  messageTime: { fontSize: 10 },
  deletedText: { fontSize: 12, fontStyle: 'italic' },
  noConvBar: { paddingVertical: 14, alignItems: 'center', borderTopWidth: 1 },
  noConvText: { fontSize: 14 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100, borderWidth: 0 },
  sendButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});
