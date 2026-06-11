import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, DarkColors } from '../../constants/theme';
import { getStoredUser, setStoredUser, setToken, userApi, aiApi, statsApi } from '../../services/api';

export default function Profile() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? DarkColors : Colors;

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ minutesStudied: 0, questionsAnswered: 0, connectionsCount: 0 });
  const [insight, setInsight] = useState('');
  const [darkMode, setDarkMode] = useState(isDark);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const u = await getStoredUser();
    setUser(u);
    try {
      const [statsData, insightData] = await Promise.all([statsApi.get(), aiApi.careerInsight()]);
      setStats(statsData);
      setInsight(insightData.insight);
    } catch {}
  }

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await setToken(null);
        await setStoredUser(null);
        router.replace('/');
      }},
    ]);
  }

  const initials = user?.name?.split(' ').map(n => n.charAt(0)).join('').toUpperCase() || 'N';

  const menuItems = [
    { icon: 'map-outline', label: 'Career Roadmap', route: '/roadmap', color: '#8B5CF6' },
    { icon: 'trophy-outline', label: `Achievements (${user?.achievements?.length || 0})`, color: '#F59E0B' },
    { icon: 'people-outline', label: `${stats.connectionsCount} Connections`, color: '#3B82F6' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.minutesStudied}</Text>
              <Text style={styles.statLabel}>Min</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.questionsAnswered}</Text>
              <Text style={styles.statLabel}>Q&A</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.connectionsCount}</Text>
              <Text style={styles.statLabel}>Conn</Text>
            </View>
          </View>
        </View>
        <Text style={styles.userName}>{user?.name || 'Nursing Student'}</Text>
        <Text style={styles.userRole}>{user?.role} · Year {user?.year}</Text>
        {user?.institution ? <Text style={styles.userInst}>{user.institution}</Text> : null}
      </LinearGradient>

      <View style={styles.body}>
        {insight ? (
          <View style={[styles.insightCard, { backgroundColor: theme.surface }]}>
            <View style={styles.insightHeader}>
              <Ionicons name="bulb" size={18} color={theme.warning} />
              <Text style={[styles.insightTitle, { color: theme.text }]}>AI Career Insight</Text>
            </View>
            <Text style={[styles.insightText, { color: theme.textSecondary }]}>{insight}</Text>
          </View>
        ) : null}

        <View style={styles.menuSection}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} style={[styles.menuItem, { backgroundColor: theme.surface }]} onPress={() => router.push(item.route)}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.settingItem, { backgroundColor: theme.surface }]}>
          <Ionicons name="moon-outline" size={20} color={theme.text} />
          <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
          <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#fff" />
        </View>

        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: theme.surface }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={theme.error} />
          <Text style={[styles.logoutText, { color: theme.error }]}>Logout</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: theme.textLight }]}>Nursphere v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 24, alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  avatarContainer: { alignItems: 'center', marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  userName: { fontSize: 22, fontWeight: '800', color: '#fff' },
  userRole: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  userInst: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  body: { padding: 16, gap: 16 },
  insightCard: { borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  insightTitle: { fontSize: 15, fontWeight: '600' },
  insightText: { fontSize: 13, lineHeight: 19, fontStyle: 'italic' },
  menuSection: { gap: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  settingItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14 },
  settingLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14 },
  logoutText: { fontSize: 15, fontWeight: '600' },
  version: { textAlign: 'center', fontSize: 12, marginBottom: 20 },
});
