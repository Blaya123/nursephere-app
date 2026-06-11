import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, DarkColors, Spacing, FontSize } from '../../constants/theme';
import { aiApi, statsApi, getStoredUser } from '../../services/api';

export default function Dashboard() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? DarkColors : Colors;

  const [user, setUser] = useState(null);
  const [insights, setInsights] = useState(null);
  const [stats, setStats] = useState({ minutesStudied: 0, questionsAnswered: 0, connectionsCount: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [insightTab, setInsightTab] = useState('tips');
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
    loadData();
  }, []);

  async function loadData() {
    const u = await getStoredUser();
    setUser(u);
    try {
      const [insightsData, statsData] = await Promise.all([aiApi.dailyInsights(), statsApi.get()]);
      setInsights(insightsData);
      setStats(statsData);
    } catch {}
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const quickActions = [
    { icon: 'chatbubble-ellipses', label: 'AI Assistant', color: '#4ADE80', route: '/assistant' },
    { icon: 'calculator', label: 'Dosage Calc', color: '#60A5FA', route: '/dosage' },
    { icon: 'search', label: 'Diagnosis', color: '#F59E0B', route: '/diagnosis' },
    { icon: 'medkit', label: 'Drug Ref', color: '#EF4444', route: '/drugs' },
    { icon: 'book', label: 'Guides', color: '#8B5CF6', route: '/guides' },
    { icon: 'map', label: 'Roadmap', color: '#EC4899', route: '/roadmap' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}>
        <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{greeting},</Text>
              <Text style={styles.userName}>{user?.name || 'Nurse'}</Text>
              <View style={styles.badge}>
                <Ionicons name="flag" size={14} color="#fff" />
                <Text style={styles.badgeText}>Nigeria</Text>
              </View>
            </View>
            <View style={styles.dateRow}>
              <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
              <Ionicons name="sparkles" size={18} color="#4ADE80" />
            </View>
          </View>

          <View style={styles.statsRow}>
            {[
              { value: stats.minutesStudied, label: 'Min Studied', icon: 'time-outline' },
              { value: stats.questionsAnswered, label: 'Questions', icon: 'checkbox-outline' },
              { value: stats.connectionsCount, label: 'Connections', icon: 'people-outline' },
            ].map((s, i) => (
              <View key={i} style={styles.statCard}>
                <Ionicons name={s.icon} size={16} color="#4ADE80" />
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <View style={[styles.insightsCard, { backgroundColor: theme.surface }]}>
            <View style={styles.insightTabs}>
              {['tips', 'news'].map((tab) => (
                <TouchableOpacity key={tab} style={[styles.insightTab, insightTab === tab && { borderBottomWidth: 2, borderBottomColor: theme.primary }]} onPress={() => setInsightTab(tab)}>
                  <Text style={[styles.insightTabText, { color: insightTab === tab ? theme.primary : theme.textSecondary }]}>{tab === 'tips' ? 'Daily Tips' : 'Global News'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.insightContent}>
              {insightTab === 'tips' ? (
                <View>
                  {insights?.tip && (
                    <View style={styles.tipRow}>
                      <Ionicons name="bulb" size={20} color={theme.warning} />
                      <Text style={[styles.insightText, { color: theme.text }]}>{insights.tip}</Text>
                    </View>
                  )}
                  {insights?.quote && (
                    <View style={[styles.quoteBox, { backgroundColor: theme.surfaceAlt }]}>
                      <Ionicons name="quote" size={18} color={theme.primary} />
                      <Text style={[styles.quoteText, { color: theme.textSecondary }]}>{insights.quote}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View>
                  {insights?.news?.split('\n').filter(l => l.trim()).map((line, i) => (
                    <View key={i} style={styles.newsRow}>
                      <Text style={[styles.newsText, { color: theme.text }]}>{line}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Access</Text>
          <View style={styles.quickGrid}>
            {quickActions.map((action, i) => (
              <TouchableOpacity key={i} style={[styles.quickCard, { backgroundColor: theme.surface }]} onPress={() => router.push(action.route)}>
                <View style={[styles.quickIcon, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={[styles.quickLabel, { color: theme.text }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  userName: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  date: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 4 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  body: { padding: 16 },
  insightsCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  insightTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  insightTab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  insightTabText: { fontSize: 14, fontWeight: '600' },
  insightContent: { padding: 16, minHeight: 80 },
  tipRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  insightText: { flex: 1, fontSize: 14, lineHeight: 20 },
  quoteBox: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 12, marginTop: 12 },
  quoteText: { flex: 1, fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  newsRow: { paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' },
  newsText: { fontSize: 13, lineHeight: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: { width: '47%', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  quickIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickLabel: { fontSize: 13, fontWeight: '600' },
});
