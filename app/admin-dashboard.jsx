import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './context/ThemeContext';
import { getStoredUser, setToken, setStoredUser, adminApi } from '../services/api';

export default function AdminDashboard() {
  const { theme } = useTheme();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNotify, setShowNotify] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);

  useEffect(() => {
    getStoredUser().then(u => { setUser(u); if (u) loadData(); else setLoading(false); });
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [dashData, usersData] = await Promise.all([
        adminApi.dashboard(),
        adminApi.users({ limit: 100 }),
      ]);
      setStats(dashData);
      setUsers(usersData.users || []);
      setUsersTotal(usersData.total || 0);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
    setLoading(false);
  }

  async function handleBroadcast() {
    if (!notifTitle || !notifMsg) { Alert.alert('Error', 'Title and message required'); return; }
    setSendingNotif(true);
    try {
      await adminApi.broadcastNotification({ title: notifTitle, message: notifMsg, type: 'announcement' });
      Alert.alert('Sent', 'Notification broadcast to all users');
      setShowNotify(false);
      setNotifTitle('');
      setNotifMsg('');
    } catch (err) { Alert.alert('Error', err.message); }
    setSendingNotif(false);
  }

  async function handleDeleteUser(id, name) {
    Alert.alert('Delete User', `Delete ${name}? This will remove all their messages.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await adminApi.deleteUser(id);
          setUsers(prev => prev.filter(u => u._id !== id));
          Alert.alert('Done', 'User deleted');
        } catch (err) { Alert.alert('Error', err.message); }
      }},
    ]);
  }

  async function handleLogout() {
    await setToken(null);
    await setStoredUser(null);
    router.replace('/login');
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.institution?.toLowerCase().includes(search.toLowerCase())
  );

  const StatCard = ({ icon, label, value, color }) => (
    <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSub}>Welcome, {user?.name || 'Admin'}</Text>
      </LinearGradient>

      <ScrollView style={styles.body}>
        {stats && (
          <>
            <View style={styles.statsGrid}>
              <StatCard icon="people" label="Total Users" value={stats.totalUsers} color="#3B82F6" />
              <StatCard icon="chatbubbles" label="Messages" value={stats.totalMessages} color="#8B5CF6" />
              <StatCard icon="time" label="Min Studied" value={stats.totalMinutesStudied} color="#F59E0B" />
              <StatCard icon="person-add" label="New Today" value={stats.usersToday} color="#10B981" />
            </View>

            {stats.roleBreakdown?.length > 0 && (
              <View style={[styles.section, { backgroundColor: theme.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Users by Programme</Text>
                {stats.roleBreakdown.map((r, i) => (
                  <View key={i} style={styles.roleRow}>
                    <Text style={[styles.roleName, { color: theme.text }]}>{r._id || 'Unknown'}</Text>
                    <View style={[styles.roleBar, { width: `${Math.min((r.count / stats.totalUsers) * 100, 100)}%`, backgroundColor: theme.primary }]} />
                    <Text style={[styles.roleCount, { color: theme.textSecondary }]}>{r.count}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.statsGrid}>
              <StatCard icon="chatbubble-ellipses" label="Pending Req" value={stats.pendingRequests || 0} color="#F59E0B" />
              <StatCard icon="chatbubbles" label="Active Chats" value={stats.activeConversations || 0} color="#10B981" />
              <StatCard icon="ban" label="Blocked" value={stats.blockedConversations || 0} color="#EF4444" />
              <StatCard icon="chatbox" label="Msgs Today" value={stats.messagesToday || 0} color="#8B5CF6" />
            </View>

            {stats.mostActiveUsers?.length > 0 && (
              <View style={[styles.section, { backgroundColor: theme.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Most Active Users</Text>
                {stats.mostActiveUsers.map((u, i) => (
                  <View key={i} style={styles.activeUserRow}>
                    <View style={[styles.activeRank, { backgroundColor: i < 3 ? theme.warning + '30' : theme.surfaceAlt }]}>
                      <Text style={[styles.activeRankText, { color: i < 3 ? theme.warning : theme.textSecondary }]}>#{i + 1}</Text>
                    </View>
                    <View style={styles.activeInfo}>
                      <Text style={[styles.activeName, { color: theme.text }]}>{u.name}</Text>
                      <Text style={[styles.activeMeta, { color: theme.textSecondary }]}>{u.role} · {u.email}</Text>
                    </View>
                    <Text style={[styles.activeCount, { color: theme.primary }]}>{u.messageCount} msgs</Text>
                  </View>
                ))}
              </View>
            )}

            {stats.messagesLast7Days?.length > 0 && (
              <View style={[styles.section, { backgroundColor: theme.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Messages (Last 7 Days)</Text>
                <View style={styles.chartRow}>
                  {stats.messagesLast7Days.map((d, i) => (
                    <View key={i} style={styles.chartBar}>
                      <View style={[styles.chartBarFill, { height: `${Math.min((d.count / Math.max(...stats.messagesLast7Days.map(x => x.count))) * 100, 100)}%`, backgroundColor: theme.primary }]} />
                      <Text style={[styles.chartLabel, { color: theme.textLight }]}>{d._id?.slice(5)}</Text>
                      <Text style={[styles.chartValue, { color: theme.textSecondary }]}>{d.count}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Users ({usersTotal})</Text>
          <TouchableOpacity style={[styles.notifBtn, { backgroundColor: theme.primary }]} onPress={() => setShowNotify(true)}>
            <Ionicons name="notifications" size={16} color="#fff" />
            <Text style={styles.notifBtnText}>Broadcast</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search" size={18} color={theme.textLight} />
          <TextInput style={[styles.searchInput, { color: theme.text }]} placeholder="Search users..." placeholderTextColor={theme.textLight} value={search} onChangeText={setSearch} />
        </View>

        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={[styles.userCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.userAvatar, { backgroundColor: theme.primary + '20' }]}>
                <Text style={[styles.userAvatarText, { color: theme.primary }]}>{item.name?.charAt(0) || '?'}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{item.email}</Text>
                <Text style={[styles.userMeta, { color: theme.textLight }]}>{item.role} · Yr {item.year} · {item.institution || 'No institution'}</Text>
                <Text style={[styles.userMeta, { color: theme.textLight }]}>Min: {item.stats?.minutesStudied || 0} · Conn: {item.stats?.connectionsCount || 0}</Text>
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteUser(item._id, item.name)}>
                <Ionicons name="trash-outline" size={18} color={theme.error} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={40} color={theme.textLight} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No users found</Text>
            </View>
          }
        />
      </ScrollView>

      <Modal visible={showNotify} transparent animationType="slide" onRequestClose={() => setShowNotify(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Broadcast Notification</Text>
              <TouchableOpacity onPress={() => setShowNotify(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Title</Text>
            <TextInput style={[styles.modalInput, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]} value={notifTitle} onChangeText={setNotifTitle} placeholder="e.g. Important Announcement" placeholderTextColor={theme.textLight} />

            <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Message</Text>
            <TextInput style={[styles.modalInput, styles.modalTextArea, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]} value={notifMsg} onChangeText={setNotifMsg} placeholder="Notification message..." placeholderTextColor={theme.textLight} multiline numberOfLines={4} />

            <Text style={[styles.modalHint, { color: theme.textLight }]}>This will be sent to ALL users in real-time.</Text>

            <TouchableOpacity style={[styles.modalSendBtn, { backgroundColor: theme.primary, opacity: sendingNotif ? 0.7 : 1 }]} onPress={handleBroadcast} disabled={sendingNotif}>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.modalSendText}>{sendingNotif ? 'Sending...' : 'Send to All Users'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  logoutBtn: { padding: 4 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  body: { padding: 12, flex: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  statCard: { width: '48%', borderRadius: 14, padding: 14, gap: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11 },
  section: { borderRadius: 14, padding: 14, marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleName: { fontSize: 12, width: 140 },
  roleBar: { height: 8, borderRadius: 4, flex: 1 },
  roleCount: { fontSize: 12, width: 30, textAlign: 'right' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  notifBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  notifBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  activeUserRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' },
  activeRank: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  activeRankText: { fontSize: 11, fontWeight: '700' },
  activeInfo: { flex: 1 },
  activeName: { fontSize: 13, fontWeight: '600' },
  activeMeta: { fontSize: 11 },
  activeCount: { fontSize: 12, fontWeight: '700' },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 100, paddingTop: 8 },
  chartBar: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  chartBarFill: { width: '60%', borderRadius: 4, minHeight: 4 },
  chartLabel: { fontSize: 9, marginTop: 4 },
  chartValue: { fontSize: 9, fontWeight: '600' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, height: 40, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14, marginLeft: 6 },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  userAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { fontSize: 14, fontWeight: '700' },
  userInfo: { flex: 1, marginLeft: 10 },
  userName: { fontSize: 14, fontWeight: '600' },
  userEmail: { fontSize: 12 },
  userMeta: { fontSize: 11, marginTop: 1 },
  deleteBtn: { padding: 6 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalLabel: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  modalInput: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, borderWidth: 1 },
  modalTextArea: { minHeight: 80, textAlignVertical: 'top' },
  modalHint: { fontSize: 12, fontStyle: 'italic', textAlign: 'center' },
  modalSendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  modalSendText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
