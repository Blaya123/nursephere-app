import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Animated, Modal } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useActiveTimer } from '../context/ActiveTimerContext';
import { getStoredUser, setStoredUser, setToken, userApi, aiApi, statsApi, auth } from '../../services/api';

const programmeOptions = [
  { value: 'BNSc Student', label: 'BNSc Nursing (4 yrs)', maxYear: 4 },
  { value: 'Diploma Nursing Student', label: 'Diploma Nursing (3 yrs)', maxYear: 3 },
  { value: 'Midwifery Student', label: 'Midwifery (RM)', maxYear: 3 },
  { value: 'Community Nursing Student', label: 'Community Nursing (CHEW)', maxYear: 3 },
  { value: 'Post-Basic Student', label: 'Post-Basic Nursing', maxYear: 1 },
];

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

export default function Profile() {
  const { isDark, theme, toggleDarkMode } = useTheme();
  const { liveMinutes } = useActiveTimer();
  const [darkMode, setDarkMode] = useState(isDark);

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ minutesStudied: 0, questionsAnswered: 0, connectionsCount: 0 });
  const [insight, setInsight] = useState('');
  const [showAcademicModal, setShowAcademicModal] = useState(false);
  const [editRole, setEditRole] = useState('');
  const [editYear, setEditYear] = useState('1');
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    setDarkMode(isDark);
  }, [isDark]);

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

  function openAcademicModal() {
    setEditRole(user?.role || 'BNSc Student');
    setEditYear(user?.year || '1');
    setShowAcademicModal(true);
  }

  function getEditYears() {
    const prog = programmeOptions.find(p => p.value === editRole);
    return Array.from({ length: prog?.maxYear || 4 }, (_, i) => String(i + 1));
  }

  async function saveAcademicInfo() {
    setSaving(true);
    try {
      const updated = await userApi.updateProfile({ role: editRole, year: editYear });
      const stored = await getStoredUser();
      const newUser = { ...stored, role: editRole, year: editYear };
      await setStoredUser(newUser);
      setUser(newUser);
      setShowAcademicModal(false);
      Alert.alert('Updated', 'Your academic info has been updated.');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Alert.alert('Error', 'Please fill all fields');
    }
    if (newPassword.length < 6) {
      return Alert.alert('Error', 'New password must be at least 6 characters');
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match');
    }
    setChangingPassword(true);
    try {
      await auth.changePassword({ currentPassword, newPassword });
      Alert.alert('Success', 'Password changed successfully');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        try {
          await setToken(null);
          await setStoredUser(null);
        } catch {}
        router.replace('/login');
      }},
    ]);
  }

  function formatDate(d) {
    if (!d) return 'N/A';
    const date = new Date(d);
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const initials = user?.name?.split(' ').map(n => n.charAt(0)).join('').toUpperCase() || 'N';

  const menuItems = [
    { icon: 'calendar-outline', label: 'Academic Planner', route: '/academic-planner', color: '#008751' },
    { icon: 'map-outline', label: 'Career Roadmap', route: '/roadmap', color: '#8B5CF6' },
    { icon: 'trophy-outline', label: `Achievements (${user?.achievements?.length || 0})`, route: '/roadmap', color: '#F59E0B' },
    { icon: 'people-outline', label: `${stats.connectionsCount} Connections`, route: '/connections', color: '#3B82F6' },
    { icon: 'settings-outline', label: 'Settings', route: undefined, color: '#6B7280', onPress: () => setShowPasswordModal(true) },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{liveMinutes || stats.minutesStudied}</Text>
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
          <TouchableOpacity onPress={openAcademicModal} style={styles.userRoleRow}>
            <Text style={styles.userRole}>{user?.role} · Year {user?.year}</Text>
            <Ionicons name="pencil" size={14} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          {user?.institution ? <Text style={styles.userInst}>{user.institution}</Text> : null}
        </LinearGradient>

        <View style={styles.body}>
          {insight ? (
            <FadeSlideIn delay={100}>
              <View style={[styles.insightCard, { backgroundColor: theme.surface }]}>
                <View style={styles.insightHeader}>
                  <Ionicons name="bulb" size={18} color={theme.warning} />
                  <Text style={[styles.insightTitle, { color: theme.text }]}>AI Career Insight</Text>
                </View>
                <Text style={[styles.insightText, { color: theme.textSecondary }]}>{insight}</Text>
              </View>
            </FadeSlideIn>
          ) : null}

          <FadeSlideIn delay={200}>
            <View style={[styles.insightCard, { backgroundColor: theme.surface }]}>
              <View style={styles.insightHeader}>
                <Ionicons name="time-outline" size={18} color={theme.primary} />
                <Text style={[styles.insightTitle, { color: theme.text }]}>Account Info</Text>
              </View>
              <Text style={[styles.insightText, { color: theme.textSecondary }]}>ID: {user?.id?.slice(-8) || 'N/A'}</Text>
              <Text style={[styles.insightText, { color: theme.textSecondary }]}>Logins: {user?.loginCount || 1}</Text>
              <Text style={[styles.insightText, { color: theme.textSecondary }]}>Last Login: {formatDate(user?.lastLogin)}</Text>
              <Text style={[styles.insightText, { color: theme.textSecondary }]}>Joined: {formatDate(user?.createdAt)}</Text>
            </View>
          </FadeSlideIn>

          <View style={styles.menuSection}>
            {menuItems.map((item, i) => (
              <FadeSlideIn key={i} delay={300 + i * 80}>
                <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.surface }]} onPress={() => item.onPress ? item.onPress() : item.route && router.push(item.route)}>
                  <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={theme.textLight} />
                </TouchableOpacity>
              </FadeSlideIn>
            ))}
          </View>

          <FadeSlideIn delay={600}>
            <View style={[styles.settingItem, { backgroundColor: theme.surface }]}>
              <Ionicons name="moon-outline" size={20} color={theme.text} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
              <Switch value={darkMode} onValueChange={(val) => { setDarkMode(val); toggleDarkMode(val); if (user?.id) userApi.updateProfile({ darkMode: val }).catch(() => {}); }} trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#fff" />
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={700}>
            <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: theme.surface }]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={theme.error} />
              <Text style={[styles.logoutText, { color: theme.error }]}>Logout</Text>
            </TouchableOpacity>
          </FadeSlideIn>

          <Text style={[styles.version, { color: theme.textLight }]}>Nursphere v1.0.0</Text>
        </View>
      </ScrollView>

      <Modal visible={showAcademicModal} transparent animationType="slide" onRequestClose={() => setShowAcademicModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Update Academic Info</Text>
              <TouchableOpacity onPress={() => setShowAcademicModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Nursing Programme</Text>
            <View style={styles.modalProgrammeRow}>
              {programmeOptions.map((p) => (
                <TouchableOpacity key={p.value} style={[styles.modalProgBtn, { backgroundColor: theme.surfaceAlt }, editRole === p.value && { backgroundColor: theme.primary }]} onPress={() => { setEditRole(p.value); setEditYear('1'); }}>
                  <Text style={[styles.modalProgBtnText, { color: theme.textSecondary }, editRole === p.value && { color: '#fff' }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Year of Study</Text>
            <View style={styles.modalYearRow}>
              {getEditYears().map((y) => (
                <TouchableOpacity key={y} style={[styles.modalYearBtn, { backgroundColor: theme.surfaceAlt }, editYear === y && { backgroundColor: theme.primary }]} onPress={() => setEditYear(y)}>
                  <Text style={[styles.modalYearBtnText, { color: theme.textSecondary }, editYear === y && { color: '#fff' }]}>Year {y}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: theme.primary, opacity: saving ? 0.7 : 1 }]} onPress={saveAcademicInfo} disabled={saving}>
              <Text style={styles.modalSaveText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showPasswordModal} transparent animationType="slide" onRequestClose={() => setShowPasswordModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Change Password</Text>
              <TouchableOpacity onPress={() => { setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordField}>
              <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Current Password</Text>
              <TextInput
                style={[styles.passwordInput, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]}
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor={theme.textLight}
              />
            </View>

            <View style={styles.passwordField}>
              <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>New Password</Text>
              <TextInput
                style={[styles.passwordInput, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password (min 6 chars)"
                placeholderTextColor={theme.textLight}
              />
            </View>

            <View style={styles.passwordField}>
              <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Confirm New Password</Text>
              <TextInput
                style={[styles.passwordInput, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={theme.textLight}
              />
            </View>

            <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: theme.primary, opacity: changingPassword ? 0.7 : 1 }]} onPress={handleChangePassword} disabled={changingPassword}>
              <Text style={styles.modalSaveText}>{changingPassword ? 'Changing...' : 'Change Password'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  userRoleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  userRole: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalLabel: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  modalProgrammeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modalProgBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  modalProgBtnText: { fontSize: 12, fontWeight: '600' },
  modalYearRow: { flexDirection: 'row', gap: 10 },
  modalYearBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalYearBtnText: { fontSize: 14, fontWeight: '600' },
  modalSaveBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  modalSaveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  passwordField: { gap: 6 },
  passwordInput: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, borderWidth: 1 },
});
