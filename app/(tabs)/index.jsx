import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated, AppState, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { aiApi, statsApi, chatApi, newsApi, getStoredUser } from '../../services/api';
import { useTheme } from '../context/ThemeContext';
import { useActiveTimer } from '../context/ActiveTimerContext';
import { useNotifications } from '../context/NotificationContext';

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

export default function Dashboard() {
  const { isDark, theme } = useTheme();
  const { liveMinutes } = useActiveTimer();
  const { unreadCount } = useNotifications();

  const [user, setUser] = useState(null);
  const [insights, setInsights] = useState(null);
  const [stats, setStats] = useState({ minutesStudied: 0, questionsAnswered: 0, connectionsCount: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [insightTab, setInsightTab] = useState('tips');
  const [greeting, setGreeting] = useState('Good morning');
  const [msgUnread, setMsgUnread] = useState(0);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
    loadData();

    const interval = setInterval(async () => {
      try {
        const data = await chatApi.getUnreadCount();
        setMsgUnread(data.unread || 0);
      } catch {}
    }, 15000);

    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        chatApi.getUnreadCount().then(d => setMsgUnread(d.unread || 0)).catch(() => {});
      }
    });

    loadNews();

    return () => { clearInterval(interval); sub?.remove(); };
  }, []);

  async function loadNews() {
    setNewsLoading(true);
    try {
      const data = await newsApi.get();
      setNews(data.articles || []);
    } catch {
      setNews([]);
    } finally {
      setNewsLoading(false);
    }
  }

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
    await Promise.all([loadData(), loadNews()]);
    setRefreshing(false);
  }, []);

  const quickActions = [
    { icon: 'calendar-outline', label: 'AP', color: '#008751', route: '/academic-planner' },
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
          <View style={styles.topRow}>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
            <View style={styles.iconRow}>
              <TouchableOpacity onPress={() => router.push('/messages')} style={styles.iconBtn}>
                <Ionicons name="chatbubbles" size={22} color="#fff" />
                {msgUnread > 0 && (
                  <View style={styles.badgeDot}>
                    <Text style={styles.badgeDotText}>{msgUnread > 9 ? '9+' : msgUnread}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.iconBtn}>
                <Ionicons name="notifications" size={22} color="#fff" />
                {unreadCount > 0 && (
                  <View style={styles.badgeDot}>
                    <Text style={styles.badgeDotText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{greeting},</Text>
              <Text style={styles.userName}>{user?.name || 'Nurse'}</Text>
              <View style={styles.flagBadge}>
                <Ionicons name="flag" size={14} color="#fff" />
                <Text style={styles.flagText}>Nigeria</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <View style={[styles.insightsCard, { backgroundColor: theme.surface }]}>
            <View style={styles.insightTabs}>
              {['tips', 'news'].map((tab) => (
                <TouchableOpacity key={tab} style={[styles.insightTab, insightTab === tab && { borderBottomWidth: 2, borderBottomColor: theme.primary }]} onPress={() => setInsightTab(tab)}>
                  <Text style={[styles.insightTabText, { color: insightTab === tab ? theme.primary : theme.textSecondary }]}>{tab === 'tips' ? 'Daily Tips' : 'Nursing News'}</Text>
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
                      <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.primary} />
                      <Text style={[styles.quoteText, { color: theme.textSecondary }]}>{insights.quote}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View>
                  {newsLoading ? (
                    <Text style={[styles.insightText, { color: theme.textSecondary, textAlign: 'center' }]}>Loading news...</Text>
                  ) : news.length === 0 ? (
                    <Text style={[styles.insightText, { color: theme.textSecondary, textAlign: 'center' }]}>No news available</Text>
                  ) : (
                    news.map((article, i) => (
                      <TouchableOpacity key={i} style={[styles.newsRow, { borderBottomColor: theme.border }]} onPress={() => article.link && Linking.openURL(article.link).catch(() => {})}>
                        <Text style={[styles.newsText, { color: theme.text }]}>{article.title}</Text>
                        <View style={styles.newsMeta}>
                          <Text style={[styles.newsSource, { color: theme.primary }]}>{article.source}</Text>
                          <Text style={[styles.newsDate, { color: theme.textLight }]}>
                            {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : ''}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Access</Text>
          <View style={styles.quickGrid}>
            {quickActions.map((action, i) => (
              <FadeSlideIn key={i} delay={i * 80} style={{ width: '47%' }}>
                <TouchableOpacity style={[styles.quickCard, { backgroundColor: theme.surface, width: '100%' }]} onPress={() => router.push(action.route)}>
                  <View style={[styles.quickIcon, { backgroundColor: action.color + '20' }]}>
                    <Ionicons name={action.icon} size={24} color={action.color} />
                  </View>
                  <Text style={[styles.quickLabel, { color: theme.text }]}>{action.label}</Text>
                </TouchableOpacity>
              </FadeSlideIn>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  date: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { position: 'relative', padding: 4 },
  badgeDot: { position: 'absolute', top: -2, right: -2, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  badgeDotText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  headerContent: {},
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  userName: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8 },
  flagBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  flagText: { color: '#fff', fontSize: 12, fontWeight: '500' },
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
  newsRow: { paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' },
  newsText: { fontSize: 13, lineHeight: 18 },
  newsMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  newsSource: { fontSize: 11, fontWeight: '600' },
  newsDate: { fontSize: 11 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: { width: '47%', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  quickIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickLabel: { fontSize: 13, fontWeight: '600' },
});
