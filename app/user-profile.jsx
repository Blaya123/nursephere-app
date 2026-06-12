import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './context/ThemeContext';
import { userApi, chatApi, getStoredUser, setStoredUser } from '../services/api';

function formatDate(d) {
  if (!d) return 'N/A';
  const date = new Date(d);
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function UserProfile() {
  const { theme } = useTheme();
  const { userId } = useLocalSearchParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);

  useEffect(() => {
    getStoredUser().then(setMe);
    if (!userId) { setLoading(false); return; }
    userApi.getUserById(userId)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const isConnected = me && profile && (me.connections || []).includes(profile._id);
  const isBlocked = me && profile && (me.blockedUsers || []).includes(profile._id);

  async function handleMessage() {
    if (!profile) return;
    try {
      const conv = await chatApi.getOrCreateConversation(profile._id);
      router.push({ pathname: '/dm-chat', params: { conversationId: conv._id, otherName: profile.name, otherUserId: profile._id } });
    } catch {
      Alert.alert('Error', 'Could not start chat');
    }
  }

  async function handleRemoveConnection() {
    if (!profile) return;
    Alert.alert('Remove Connection', `Remove ${profile.name} from your connections?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          const result = await userApi.removeConnection(profile._id);
          const stored = await getStoredUser();
          stored.connections = (stored.connections || []).filter(id => id !== profile._id);
          stored.stats = { ...stored.stats, connectionsCount: result.connectionsCount };
          await setStoredUser(stored);
          setMe(stored);
          Alert.alert('Done', 'Connection removed');
        } catch { Alert.alert('Error', 'Could not remove connection'); }
      }},
    ]);
  }

  async function handleBlock() {
    if (!profile) return;
    Alert.alert('Block User', `Block ${profile.name}? They will not be able to message you.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: async () => {
        try {
          await userApi.blockUser(profile._id);
          const stored = await getStoredUser();
          stored.blockedUsers = [...(stored.blockedUsers || []), profile._id];
          stored.connections = (stored.connections || []).filter(id => id !== profile._id);
          await setStoredUser(stored);
          setMe(stored);
          Alert.alert('Done', 'User blocked');
        } catch { Alert.alert('Error', 'Could not block user'); }
      }},
    ]);
  }

  async function handleUnblock() {
    try {
      await userApi.unblockUser(profile._id);
      const stored = await getStoredUser();
      stored.blockedUsers = (stored.blockedUsers || []).filter(id => id !== profile._id);
      await setStoredUser(stored);
      setMe(stored);
      Alert.alert('Done', 'User unblocked');
    } catch { Alert.alert('Error', 'Could not unblock user'); }
  }

  const initials = profile?.name?.split(' ').map(n => n.charAt(0)).join('').toUpperCase() || '?';

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <Ionicons name="person-outline" size={48} color={theme.textLight} />
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>User not found</Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.surface }]} onPress={() => router.back()}>
          <Text style={[styles.backBtnText, { color: theme.primary }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{profile.name}</Text>
        <View style={styles.roleRow}>
          <Ionicons name="school-outline" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={styles.roleText}>{profile.role} · Year {profile.year}</Text>
        </View>
        {profile.institution ? (
          <Text style={styles.instText}>{profile.institution}</Text>
        ) : null}
      </LinearGradient>

      <ScrollView style={styles.body}>
        <View style={[styles.statsCard, { backgroundColor: theme.surface }]}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color={theme.primary} />
              <Text style={[styles.statValue, { color: theme.text }]}>{profile.stats?.minutesStudied || 0}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Min Studied</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={20} color={theme.primary} />
              <Text style={[styles.statValue, { color: theme.text }]}>{profile.connectionsCount}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Connections</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={20} color={theme.primary} />
              <Text style={[styles.statValue, { color: theme.text }]}>{formatDate(profile.createdAt).split(' ')[1]}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Joined</Text>
            </View>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.infoTitle, { color: theme.text }]}>About</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Programme</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{profile.role}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Level</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>Year {profile.year}</Text>
          </View>
          {profile.institution ? (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Institution</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{profile.institution}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Member Since</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{formatDate(profile.createdAt)}</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primary }]} onPress={handleMessage}>
          <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>Send Message</Text>
        </TouchableOpacity>

        {isConnected && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.error }]} onPress={handleRemoveConnection}>
            <Ionicons name="person-remove-outline" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Remove Connection</Text>
          </TouchableOpacity>
        )}

        {isBlocked ? (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.success }]} onPress={handleUnblock}>
            <Ionicons name="unlock-outline" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Unblock User</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#6B7280' }]} onPress={handleBlock}>
            <Ionicons name="ban-outline" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Block User</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 15 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  backBtnText: { fontSize: 14, fontWeight: '600' },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24, alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backIcon: { alignSelf: 'flex-start', padding: 4, marginBottom: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  name: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roleText: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  instText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  body: { padding: 16, flex: 1 },
  statsCard: { borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  statRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11 },
  statDivider: { width: 1, height: 40 },
  infoCard: { borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  infoTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '500' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, marginBottom: 12 },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
