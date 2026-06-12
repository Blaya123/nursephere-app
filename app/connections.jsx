import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { userApi, chatApi, getStoredUser, setStoredUser } from '../services/api';
import { useTheme } from './context/ThemeContext';

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

export default function Connections() {
  const { theme } = useTheme();
  const [tab, setTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [users, setUsers] = useState([]);
  const [myConnections, setMyConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const me = await getStoredUser();
      setMyConnections(me?.connections || []);
      const [allUsers, myFriends] = await Promise.all([
        userApi.getUsers().catch(() => []),
        userApi.getConnections().catch(() => []),
      ]);
      setUsers(allUsers);
      setFriends(myFriends || []);
    } catch {} finally {
      setLoading(false);
    }
  }

  async function handleConnect(userId, userName) {
    try {
      const conv = await chatApi.getOrCreateConversation(userId);
      const storedUser = await getStoredUser();
      storedUser.connections = [...(storedUser.connections || []), userId];
      await setStoredUser(storedUser);
      setMyConnections(prev => [...prev, userId]);
      router.push({ pathname: '/dm-chat', params: { conversationId: conv._id, otherName: userName || 'New User', otherUserId: userId } });
    } catch {
      Alert.alert('Error', 'Could not connect. Please try again.');
    }
  }

  async function startChat(userId, userName) {
    try {
      const conv = await chatApi.getOrCreateConversation(userId);
      router.push({ pathname: '/dm-chat', params: { conversationId: conv._id, otherName: userName, otherUserId: userId } });
    } catch {
      Alert.alert('Error', 'Could not start chat.');
    }
  }

  function getInitials(name) {
    return name?.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2) || '?';
  }

  const filteredUsers = users.filter(u =>
    !myConnections.includes(u._id) &&
    (u.name?.toLowerCase().includes(search.toLowerCase()) ||
     u.institution?.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredFriends = friends.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.institution?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Connections</Text>
      </View>

      <View style={[styles.tabRow, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={[styles.tab, tab === 'friends' && { borderBottomWidth: 2, borderBottomColor: theme.primary }]} onPress={() => setTab('friends')}>
          <Text style={[styles.tabText, { color: tab === 'friends' ? theme.primary : theme.textSecondary }]}>My Friends ({friends.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'find' && { borderBottomWidth: 2, borderBottomColor: theme.primary }]} onPress={() => setTab('find')}>
          <Text style={[styles.tabText, { color: tab === 'find' ? theme.primary : theme.textSecondary }]}>Find People</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="search" size={18} color={theme.textLight} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder={tab === 'friends' ? 'Search friends...' : 'Search by name or institution...'}
          placeholderTextColor={theme.textLight}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : tab === 'friends' ? (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={theme.textLight} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No friends yet</Text>
              <Text style={[styles.emptySub, { color: theme.textLight }]}>Go to Find People to connect with other nurses</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <FadeSlideIn delay={index * 60}>
              <TouchableOpacity style={[styles.userCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => router.push({ pathname: '/user-profile', params: { userId: item._id } })}>
                <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
                  <Text style={[styles.avatarText, { color: theme.primary }]}>{getInitials(item.name)}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.userMeta, { color: theme.textSecondary }]}>
                    {item.role} · Year {item.year}
                  </Text>
                  {item.institution ? (
                    <Text style={[styles.userInst, { color: theme.textLight }]}>{item.institution}</Text>
                  ) : null}
                  <Text style={[styles.connCount, { color: theme.textLight }]}>{item.connectionsCount || 0} connections</Text>
                </View>
                <View style={styles.actionCol}>
                  <View style={[styles.connectedBadge, { backgroundColor: theme.success + '20' }]}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                  </View>
                  <TouchableOpacity style={[styles.msgBtn, { backgroundColor: theme.primary }]} onPress={() => startChat(item._id, item.name)}>
                    <Ionicons name="chatbubble" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </FadeSlideIn>
          )}
        />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={theme.textLight} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No users found</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <FadeSlideIn delay={index * 60}>
              <TouchableOpacity style={[styles.userCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => router.push({ pathname: '/user-profile', params: { userId: item._id } })}>
                <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
                  <Text style={[styles.avatarText, { color: theme.primary }]}>{getInitials(item.name)}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.userMeta, { color: theme.textSecondary }]}>
                    {item.role} · Year {item.year}
                  </Text>
                  {item.institution ? (
                    <Text style={[styles.userInst, { color: theme.textLight }]}>{item.institution}</Text>
                  ) : null}
                  <Text style={[styles.connCount, { color: theme.textLight }]}>{item.stats?.connectionsCount || 0} connections</Text>
                </View>
                <TouchableOpacity style={[styles.connectBtn, { backgroundColor: theme.primary }]} onPress={() => handleConnect(item._id, item.name)}>
                  <Ionicons name="person-add" size={16} color="#fff" />
                  <Text style={styles.connectText}>Connect</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </FadeSlideIn>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  tabRow: { flexDirection: 'row', borderBottomWidth: 0.5 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', margin: 16, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, height: 44 },
  searchInput: { flex: 1, fontSize: 15, marginLeft: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700' },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 15, fontWeight: '600' },
  userMeta: { fontSize: 12, marginTop: 1 },
  userInst: { fontSize: 12, marginTop: 1 },
  connCount: { fontSize: 11, marginTop: 2 },
  actionCol: { flexDirection: 'column', alignItems: 'center', gap: 6 },
  connectBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  connectText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  connectedBadge: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 20 },
  msgBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 8 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  emptySub: { fontSize: 12, textAlign: 'center' },
});
