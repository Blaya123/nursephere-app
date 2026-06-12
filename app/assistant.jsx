import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Keyboard, Platform, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';

import { aiApi } from '../services/api';
import { useTheme } from './context/ThemeContext';

const SUGGESTIONS = [
  'How do I prepare for NMCN exam?',
  'Explain the nursing process',
  'What are the vital signs and their normal ranges?',
  'How to calculate IV drip rate?',
];

export default function AIAssistant() {
  const { isDark, theme } = useTheme();
  const { prompt } = useLocalSearchParams();

  const [messages, setMessages] = useState([
    { id: '0', text: "Hello! I'm your Nursphere AI assistant. Ask me anything about nursing, exams, procedures, or your career!", isUser: false },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const flatListRef = useRef(null);
  const sentPromptRef = useRef(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    if (prompt && !sentPromptRef.current) {
      sentPromptRef.current = true;
      const text = decodeURIComponent(prompt);
      const userMsg = { id: Date.now().toString(), text, isUser: true };
      setMessages(prev => [...prev, userMsg]);
      setLoading(true);
      const history = [{ role: 'user', parts: [{ text }] }];
      aiApi.chat(text, history, null).then(data => {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: data.response, isUser: false }]);
        if (data.sessionId) setSessionId(data.sessionId);
      }).catch(() => {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: 'Sorry, I had trouble responding. Please try again.', isUser: false }]);
      }).finally(() => setLoading(false));
    }
  }, [prompt]);

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const data = await aiApi.getHistory();
      setSessions(data || []);
    } catch {}
    setLoadingHistory(false);
    setShowHistory(true);
  }

  async function loadSession(session) {
    setShowHistory(false);
    setLoading(true);
    try {
      const data = await aiApi.getSession(session._id);
      const msgs = [{ id: '0', text: "Hello! I'm your Nursphere AI assistant. Ask me anything about nursing, exams, procedures, or your career!", isUser: false }];
      data.messages.forEach((m, i) => {
        msgs.push({ id: `hist-${i}`, text: m.text, isUser: m.role === 'user' });
      });
      setMessages(msgs);
      setSessionId(session._id);
    } catch {}
    setLoading(false);
  }

  async function deleteSession(id) {
    try {
      await aiApi.deleteSession(id);
      setSessions(prev => prev.filter(s => s._id !== id));
    } catch {}
  }

  function startNewChat() {
    setMessages([{ id: '0', text: "Hello! I'm your Nursphere AI assistant. Ask me anything about nursing, exams, procedures, or your career!", isUser: false }]);
    setSessionId(null);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = { id: Date.now().toString(), text: input.trim(), isUser: true };
    setMessages(prev => [...prev, userMsg]);
    const msgText = input.trim();
    setInput('');
    setLoading(true);

    try {
      const history = messages.filter(m => m.id !== '0').map(m => ({ role: m.isUser ? 'user' : 'model', parts: [{ text: m.text }] }));
      const data = await aiApi.chat(msgText, history, sessionId);
      const aiMsg = { id: (Date.now() + 1).toString(), text: data.response, isUser: false };
      setMessages(prev => [...prev, aiMsg]);
      if (data.sessionId) setSessionId(data.sessionId);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: 'Sorry, I had trouble responding. Please try again.', isUser: false }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.aiIcon, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="sparkles" size={20} color={theme.primary} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>AI Assistant</Text>
            <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Powered by AI</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {sessionId && (
            <TouchableOpacity onPress={startNewChat} style={styles.headerBtn}>
              <Ionicons name="add-circle" size={22} color={theme.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={loadHistory} style={styles.headerBtn}>
            <Ionicons name="time-outline" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={() => !loading && messages.length === 1 ? (
          <View style={styles.suggestions}>
            <Text style={[styles.suggestTitle, { color: theme.textSecondary }]}>Try asking:</Text>
            {SUGGESTIONS.map((s, i) => (
              <TouchableOpacity key={i} style={[styles.suggestionChip, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]} onPress={() => { setInput(s); }}>
                <Text style={[styles.suggestionText, { color: theme.text }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
        renderItem={({ item }) => (
          <View style={[styles.messageRow, item.isUser ? styles.userRow : styles.aiRow]}>
            {!item.isUser && (
              <View style={[styles.avatarCircle, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="sparkles" size={16} color={theme.primary} />
              </View>
            )}
            <View style={[styles.messageBubble, item.isUser ? { backgroundColor: theme.primary } : { backgroundColor: theme.surfaceAlt }, { borderColor: theme.border }]}>
              <Text style={[styles.messageText, { color: item.isUser ? '#fff' : theme.text }]}>{item.text}</Text>
            </View>
          </View>
        )}
      />

      {loading && (
        <View style={[styles.typingIndicator, { backgroundColor: theme.surfaceAlt }]}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.typingText, { color: theme.textSecondary }]}>AI is thinking...</Text>
        </View>
      )}

      <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: Platform.OS === 'android' ? keyboardHeight + 8 : 8 }]}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]}
          placeholder="Ask anything about nursing..."
          placeholderTextColor={theme.textLight}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
        />
        <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme.primary }]} onPress={sendMessage} disabled={loading || !input.trim()}>
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <Modal visible={showHistory} transparent animationType="slide" onRequestClose={() => setShowHistory(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Chat History</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            {loadingHistory ? (
              <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
            ) : sessions.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Ionicons name="chatbubbles-outline" size={40} color={theme.textLight} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No chat history yet</Text>
              </View>
            ) : (
              <FlatList
                data={sessions}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={[styles.historyItem, { borderBottomColor: theme.border }]} onPress={() => loadSession(item)}>
                    <View style={styles.historyContent}>
                      <Text style={[styles.historyTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                      <Text style={[styles.historyMeta, { color: theme.textSecondary }]}>{item.messageCount} messages</Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteSession(item._id)} style={styles.deleteBtn}>
                      <Ionicons name="trash-outline" size={18} color={theme.error} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: { padding: 4 },
  aiIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 12 },
  messagesList: { padding: 16, paddingBottom: 8 },
  suggestions: { marginBottom: 20 },
  suggestTitle: { fontSize: 13, marginBottom: 8 },
  suggestionChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  suggestionText: { fontSize: 14 },
  messageRow: { flexDirection: 'row', marginBottom: 12, maxWidth: '85%' },
  userRow: { alignSelf: 'flex-end' },
  aiRow: { alignSelf: 'flex-start', gap: 8 },
  avatarCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  messageBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  messageText: { fontSize: 15, lineHeight: 21 },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, marginHorizontal: 16, borderRadius: 12, marginBottom: 4 },
  typingText: { fontSize: 13 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100, borderWidth: 0 },
  sendButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  emptyHistory: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14 },
  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5 },
  historyContent: { flex: 1 },
  historyTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  historyMeta: { fontSize: 12 },
  deleteBtn: { padding: 8 },
});
