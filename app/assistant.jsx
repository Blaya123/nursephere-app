import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { aiApi } from '../services/api';
import { useTheme } from './context/ThemeContext';

const SUGGESTIONS = [
  'How do I prepare for NMCN exam?',
  'Explain the nursing process',
  'What are the vital signs and their normal ranges?',
  'How to calculate IV drip rate?',
];

const Container = Platform.OS === 'ios' ? KeyboardAvoidingView : View;

export default function AIAssistant() {
  const { isDark, theme } = useTheme();

  const [messages, setMessages] = useState([
    { id: '0', text: "Hello! I'm your Nursphere AI assistant. Ask me anything about nursing, exams, procedures, or your career!", isUser: false },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = { id: Date.now().toString(), text: input.trim(), isUser: true };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.filter(m => m.id !== '0').map(m => ({ role: m.isUser ? 'user' : 'model', parts: [{ text: m.text }] }));
      const data = await aiApi.chat(userMsg.text, history);
      const aiMsg = { id: (Date.now() + 1).toString(), text: data.response, isUser: false };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: 'Sorry, I had trouble responding. Please try again.', isUser: false }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container style={[styles.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
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

      <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
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
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
});
