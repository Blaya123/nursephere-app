import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { userApi, getStoredUser } from '../services/api';
import { useTheme } from './context/ThemeContext';

export default function Connections() {
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [myConnections, setMyConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const me = await getStoredUser();
      setMyConnections(me?.connections || []);
      const allUsers = await userApi.getUsers();
      setUsers(allUsers);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect(userId) {
    try {
      await userApi.connect(userId);
      setMyConnections(prev => [...prev, userId]);
      Alert.alert('Connected!', 'You are now connected with this user.');
    } catch {
      Alert.alert('Error', 'Could not connect. Please try again.');
    }
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.institution?.toLowerCase().includes(search.toLowerCase())
  );

  function getInitials(name) {
    return name?.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2) || '?';
  }

  function isConnected(userId) {
    return myConnections.includes(userId);
  }

  function formatConnections(user) {
    return `${user.stats?.connectionsCount || 0} connections`;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Connections</Text>
        <TouchableOpacity onPress={loadUsers}>
          <Ionicons name="refresh" size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="search" size={18} color={theme.textLight} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search by name or institution..."
          placeholderTextColor={theme.textLight}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View style={[styles.userCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
                <Text style={[styles.connCount, { color: theme.textLight }]}>{formatConnections(item)}</Text>
              </View>
              {isConnected(item._id) ? (
                <View style={[styles.connectedBadge, { backgroundColor: theme.success + '20' }]}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                  <Text style={[styles.connectedText, { color: theme.success }]}>Connected</Text>
                </View>
              ) : (
                <TouchableOpacity style={[styles.connectBtn, { backgroundColor: theme.primary }]} onPress={() => handleConnect(item._id)}>
                  <Ionicons name="person-add" size={16} color="#fff" />
                  <Text style={styles.connectText}>Connect</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={theme.textLight} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No users found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
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
  connectBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  connectText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  connectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  connectedText: { fontSize: 12, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
