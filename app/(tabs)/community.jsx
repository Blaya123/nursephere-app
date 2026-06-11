import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Channels } from '../../constants/theme';
import { chatApi, getStoredUser } from '../../services/api';
import { useTheme } from '../context/ThemeContext';

const REACTIONS = ['👍', '❤️', '🔥', '😂', '🙏', '💪'];

export default function Community() {
  const { isDark, theme } = useTheme();

  const [activeChannel, setActiveChannel] = useState('general');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChannels, setShowChannels] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    getStoredUser().then(setUser);
  }, []);

  useEffect(() => {
    loadMessages();
  }, [activeChannel]);

  async function loadMessages() {
    setLoading(true);
    try {
      const data = await chatApi.getMessages(activeChannel);
      setMessages(data);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || !user) return;
    const msgData = { channel: activeChannel, text: input.trim(), userName: user.name, userAvatar: user.avatar || '' };
    setMessages(prev => [...prev, { ...msgData, _id: Date.now().toString(), createdAt: new Date().toISOString(), reactions: [] }]);
    setInput('');
    try {
      await chatApi.sendMessage(msgData);
    } catch {}
  }

  function formatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  function getChannelIcon(id) {
    const c = Channels.find(ch => ch.id === id);
    return c?.icon || '💬';
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.headerLeft} onPress={() => setShowChannels(!showChannels)}>
          <Text style={[styles.channelIcon]}>{getChannelIcon(activeChannel)}</Text>
          <View>
            <Text style={[styles.channelName, { color: theme.text }]}>#{activeChannel}</Text>
            <Text style={[styles.channelDesc, { color: theme.textSecondary }]}>{Channels.find(c => c.id === activeChannel)?.description}</Text>
          </View>
          <Ionicons name={showChannels ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadMessages}>
          <Ionicons name="refresh" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {showChannels && (
        <View style={[styles.channelList, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          {Channels.map(ch => (
            <TouchableOpacity key={ch.id} style={[styles.channelItem, activeChannel === ch.id && { backgroundColor: theme.primary + '15' }]} onPress={() => { setActiveChannel(ch.id); setShowChannels(false); }}>
              <Text style={styles.chItemIcon}>{ch.icon}</Text>
              <View>
                <Text style={[styles.chItemName, { color: theme.text }]}>#{ch.name}</Text>
                <Text style={[styles.chItemDesc, { color: theme.textSecondary }]}>{ch.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={styles.messageContainer}>
              <View style={styles.messageHeader}>
                <View style={[styles.msgAvatar, { backgroundColor: theme.primary + '20' }]}>
                  <Text style={[styles.avatarText, { color: theme.primary }]}>{item.userName?.charAt(0) || '?'}</Text>
                </View>
                <View style={styles.msgMeta}>
                  <Text style={[styles.msgName, { color: theme.text }]}>{item.userName}</Text>
                  <Text style={[styles.msgTime, { color: theme.textLight }]}>{formatTime(item.createdAt)}</Text>
                </View>
              </View>
              <Text style={[styles.msgText, { color: theme.text }]}>{item.text}</Text>
              <View style={styles.reactionsRow}>
                {REACTIONS.map(emoji => {
                  const react = item.reactions?.find(r => r.emoji === emoji);
                  return (
                    <TouchableOpacity key={emoji} style={[styles.reactionBtn, { borderColor: theme.border }]}>
                      <Text style={styles.reactionEmoji}>{emoji}</Text>
                      {react?.users?.length > 0 && <Text style={[styles.reactionCount, { color: theme.textSecondary }]}>{react.users.length}</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TextInput style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text }]} placeholder="Type a message..." placeholderTextColor={theme.textLight} value={input} onChangeText={setInput} multiline maxLength={500} />
          <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme.primary }]} onPress={sendMessage} disabled={!input.trim()}>
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  channelIcon: { fontSize: 24 },
  channelName: { fontSize: 17, fontWeight: '700' },
  channelDesc: { fontSize: 11 },
  refreshBtn: { padding: 8 },
  channelList: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  channelItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4 },
  chItemIcon: { fontSize: 22 },
  chItemName: { fontSize: 15, fontWeight: '600' },
  chItemDesc: { fontSize: 11 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messagesList: { padding: 16, paddingBottom: 8 },
  messageContainer: { marginBottom: 16 },
  messageHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  msgAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700' },
  msgMeta: { flex: 1 },
  msgName: { fontSize: 14, fontWeight: '600' },
  msgTime: { fontSize: 11 },
  msgText: { fontSize: 15, lineHeight: 21, marginLeft: 46 },
  reactionsRow: { flexDirection: 'row', gap: 4, marginTop: 6, marginLeft: 46 },
  reactionBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, borderWidth: 1 },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { fontSize: 11 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 80 },
  sendButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});
