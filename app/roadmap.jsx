import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, DarkColors } from '../constants/theme';
import { aiApi } from '../services/api';

export default function Roadmap() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? DarkColors : Colors;

  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRoadmap(); }, []);

  async function loadRoadmap() {
    setLoading(true);
    try {
      const data = await aiApi.roadmap();
      setMilestones(data.milestones || []);
    } catch { setMilestones([]); } finally { setLoading(false); }
  }

  const completed = milestones.filter(m => m.status === 'completed').length;
  const progress = milestones.length > 0 ? (completed / milestones.length) * 100 : 0;
  const currentMilestone = milestones.find(m => m.status === 'in-progress') || milestones.find(m => m.status === 'upcoming');

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Career Roadmap</Text>
        <TouchableOpacity onPress={loadRoadmap}>
          <Ionicons name="refresh" size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Generating your personalized roadmap...</Text>
        </View>
      ) : milestones.length > 0 ? (
        <View style={styles.body}>
          <View style={[styles.heroCard, { backgroundColor: theme.surface }]}>
            <View style={styles.heroTop}>
              <Ionicons name="map" size={28} color={theme.primary} />
              <Text style={[styles.heroTitle, { color: theme.text }]}>Your Nursing Journey</Text>
            </View>
            <Text style={[styles.heroSub, { color: theme.textSecondary }]}>{completed} of {milestones.length} milestones completed</Text>

            <View style={styles.progressContainer}>
              <View style={[styles.progressBg, { backgroundColor: theme.surfaceAlt }]}>
                <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.primary }]} />
              </View>
              <Text style={[styles.progressText, { color: theme.primary }]}>{Math.round(progress)}%</Text>
            </View>

            {currentMilestone && (
              <View style={[styles.focusCard, { backgroundColor: theme.primary + '10' }]}>
                <Text style={[styles.focusLabel, { color: theme.primary }]}>Current Focus</Text>
                <Text style={[styles.focusTitle, { color: theme.text }]}>{currentMilestone.title}</Text>
                <Text style={[styles.focusDesc, { color: theme.textSecondary }]}>{currentMilestone.description}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.timelineTitle, { color: theme.text }]}>Milestones</Text>

          {milestones.map((m, i) => (
            <View key={i} style={styles.milestoneRow}>
              <View style={styles.timelineLeft}>
                <View style={[styles.dot, {
                  backgroundColor: m.status === 'completed' ? theme.success : m.status === 'in-progress' ? theme.primary : theme.surfaceAlt,
                  borderColor: m.status === 'completed' ? theme.success : m.status === 'in-progress' ? theme.primary : theme.border,
                }]}>
                  {m.status === 'completed' && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                {i < milestones.length - 1 && <View style={[styles.line, { backgroundColor: theme.border }]} />}
              </View>
              <View style={[styles.milestoneCard, { backgroundColor: theme.surface, borderColor: theme.border, opacity: m.status === 'upcoming' ? 0.6 : 1 }]}>
                <View style={styles.milestoneHeader}>
                  <Text style={[styles.milestoneTitle, { color: theme.text }]}>{m.title}</Text>
                  <View style={[styles.statusBadge, {
                    backgroundColor: m.status === 'completed' ? theme.success + '20' : m.status === 'in-progress' ? theme.primary + '20' : theme.surfaceAlt,
                  }]}>
                    <Text style={[styles.statusText, {
                      color: m.status === 'completed' ? theme.success : m.status === 'in-progress' ? theme.primary : theme.textLight,
                    }]}>{m.status}</Text>
                  </View>
                </View>
                <Text style={[styles.milestoneDesc, { color: theme.textSecondary }]}>{m.description}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={48} color={theme.textLight} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Complete your profile to generate a personalized career roadmap</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  loadingText: { fontSize: 14 },
  body: { padding: 16, gap: 16 },
  heroCard: { borderRadius: 20, padding: 20 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  heroTitle: { fontSize: 20, fontWeight: '700' },
  heroSub: { fontSize: 13, marginBottom: 16 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  progressBg: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 14, fontWeight: '700' },
  focusCard: { borderRadius: 14, padding: 14 },
  focusLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  focusTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  focusDesc: { fontSize: 13, lineHeight: 18 },
  timelineTitle: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  milestoneRow: { flexDirection: 'row', gap: 12 },
  timelineLeft: { alignItems: 'center', width: 24 },
  dot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  line: { width: 2, flex: 1, minHeight: 30 },
  milestoneCard: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 12 },
  milestoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  milestoneTitle: { fontSize: 15, fontWeight: '600', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  milestoneDesc: { fontSize: 13, lineHeight: 18 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
