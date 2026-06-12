import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './context/ThemeContext';
import { apApi } from '../services/api';

export default function AcademicPlanner() {
  const { isDark, theme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [semesterIndex, setSemesterIndex] = useState(0);
  const [courseModal, setCourseModal] = useState(null);

  useEffect(() => { loadAP(); }, []);

  async function loadAP() {
    setLoading(true);
    setError('');
    try {
      const json = await apApi.get();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.message || 'Failed to load academic planner');
      }
    } catch (err) {
      setError('Could not connect. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  }

  const semester = data?.semesters?.[semesterIndex];
  const totalCredits = data?.totalCredits || 0;
  const totalCourses = data?.totalCourses || 0;

  const statCards = [
    { icon: 'book', value: totalCourses, label: 'Courses' },
    { icon: 'layers', value: totalCredits, label: 'Credits' },
    { icon: 'time', value: data?.studyHoursTarget || 0, label: 'Study Hrs' },
    { icon: 'medkit', value: data?.clinicalRotation?.length || 0, label: 'Rotations' },
  ];

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading your academic planner...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.primary }]} onPress={loadAP}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Academic Planner</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>{data?.programme}</Text>
        </View>
        <TouchableOpacity onPress={loadAP}>
          <Ionicons name="refresh" size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={[styles.heroCard, { backgroundColor: theme.surface }]}>
          <View style={styles.heroTop}>
            <View style={[styles.yearBadge, { backgroundColor: theme.primary + '20' }]}>
              <Ionicons name="school" size={22} color={theme.primary} />
            </View>
            <View style={styles.heroInfo}>
              <Text style={[styles.heroTitle, { color: theme.text }]}>{data?.title}</Text>
              <Text style={[styles.heroSub, { color: theme.textSecondary }]}>{data?.description}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            {statCards.map((s, i) => (
              <View key={i} style={[styles.statCard, { backgroundColor: theme.surfaceAlt }]}>
                <Ionicons name={s.icon} size={18} color={theme.primary} />
                <Text style={[styles.statValue, { color: theme.text }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {data?.semesters?.length > 1 && (
          <View style={styles.semesterTabs}>
            {data.semesters.map((s, i) => (
              <TouchableOpacity key={i} style={[styles.semesterTab, semesterIndex === i && { borderBottomWidth: 2, borderBottomColor: theme.primary }]} onPress={() => setSemesterIndex(i)}>
                <Text style={[styles.semesterTabText, { color: semesterIndex === i ? theme.primary : theme.textSecondary }]}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {semester && (
          <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{semester.name} Courses</Text>
            {semester.courses.map((course, i) => (
              <TouchableOpacity key={i} style={[styles.courseRow, i < semester.courses.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: theme.border }]} onPress={() => setCourseModal(course)}>
                <View style={[styles.courseDot, { backgroundColor: theme.primary }]} />
                <View style={styles.courseInfo}>
                  <View style={styles.courseHeader}>
                    <Text style={[styles.courseCode, { color: theme.primary }]}>{course.code}</Text>
                    <Text style={[styles.courseCredits, { color: theme.textSecondary }]}>{course.credits} cr</Text>
                  </View>
                  <Text style={[styles.courseTitle, { color: theme.text }]}>{course.title}</Text>
                  <Text style={[styles.courseDesc, { color: theme.textSecondary }]}>{course.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textLight} style={{ alignSelf: 'center' }} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {data?.keyTopics?.length > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Key Topics</Text>
            <View style={styles.tagsRow}>
              {data.keyTopics.map((topic, i) => (
                <View key={i} style={[styles.tag, { backgroundColor: theme.primary + '15' }]}>
                  <Ionicons name="checkmark-circle" size={14} color={theme.primary} />
                  <Text style={[styles.tagText, { color: theme.primary }]}>{topic}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {data?.skillsToMaster?.length > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Skills to Master</Text>
            <View style={styles.tagsRow}>
              {data.skillsToMaster.map((skill, i) => (
                <View key={i} style={[styles.tag, { backgroundColor: theme.warning + '15' }]}>
                  <Ionicons name="fitness" size={14} color={theme.warning} />
                  <Text style={[styles.tagText, { color: theme.warning }]}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {data?.clinicalRotation?.length > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Clinical Rotations</Text>
            <View style={styles.tagsRow}>
              {data.clinicalRotation.map((rot, i) => (
                <View key={i} style={[styles.tag, { backgroundColor: '#10B981' + '15' }]}>
                  <Ionicons name="medkit" size={14} color="#10B981" />
                  <Text style={[styles.tagText, { color: '#10B981' }]}>{rot}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {data?.nmcnRelevance && (
          <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
            <View style={styles.nmcnRow}>
              <Ionicons name="trophy" size={20} color={theme.warning} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>NMCN Exam Relevance</Text>
            </View>
            <Text style={[styles.nmcnText, { color: theme.textSecondary }]}>{data.nmcnRelevance}</Text>
          </View>
        )}

        <Modal visible={!!courseModal} transparent animationType="slide" onRequestClose={() => setCourseModal(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Course Details</Text>
                <TouchableOpacity onPress={() => setCourseModal(null)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
              {courseModal && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={[styles.modalCodeBadge, { backgroundColor: theme.primary + '20' }]}>
                    <Text style={[styles.modalCode, { color: theme.primary }]}>{courseModal.code}</Text>
                    <Text style={[styles.modalCredits, { color: theme.textSecondary }]}>{courseModal.credits} Credits</Text>
                  </View>
                  <Text style={[styles.modalCourseTitle, { color: theme.text }]}>{courseModal.title}</Text>
                  <Text style={[styles.modalDesc, { color: theme.textSecondary }]}>{courseModal.description}</Text>

                  {courseModal.studyNotes && (
                    <View style={[styles.modalSection, { backgroundColor: theme.surfaceAlt }]}>
                      <View style={styles.modalSectionHeader}>
                        <Ionicons name="book" size={18} color={theme.primary} />
                        <Text style={[styles.modalSectionTitle, { color: theme.text }]}>Study Notes</Text>
                      </View>
                      <Text style={[styles.modalStudyText, { color: theme.textSecondary }]}>{courseModal.studyNotes}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.studyAiBtn, { backgroundColor: theme.primary }]}
                    onPress={() => {
                      const prompt = encodeURIComponent(`Help me study ${courseModal.code} - ${courseModal.title}. ${courseModal.studyNotes || ''}`);
                      setCourseModal(null);
                      router.push(`/(tabs)/assistant?prompt=${prompt}`);
                    }}
                  >
                    <Ionicons name="sparkles" size={20} color="#fff" />
                    <Text style={styles.studyAiBtnText}>Study with AI</Text>
                  </TouchableOpacity>

                  <View style={{ height: 32 }} />
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        <View style={{ height: 32 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  loadingText: { fontSize: 14, textAlign: 'center' },
  errorText: { fontSize: 14, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 1 },
  body: { padding: 16, gap: 16 },
  heroCard: { borderRadius: 20, padding: 20 },
  heroTop: { flexDirection: 'row', gap: 14 },
  yearBadge: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  heroInfo: { flex: 1 },
  heroTitle: { fontSize: 17, fontWeight: '700', marginBottom: 2 },
  heroSub: { fontSize: 12, lineHeight: 17 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  statCard: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10 },
  semesterTabs: { flexDirection: 'row', gap: 0, borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' },
  semesterTab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  semesterTabText: { fontSize: 13, fontWeight: '600' },
  sectionCard: { borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  courseRow: { flexDirection: 'row', gap: 10, paddingVertical: 12 },
  courseDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  courseInfo: { flex: 1 },
  courseHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  courseCode: { fontSize: 12, fontWeight: '700' },
  courseCredits: { fontSize: 11 },
  courseTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  courseDesc: { fontSize: 12, lineHeight: 16 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  tagText: { fontSize: 12, fontWeight: '500' },
  nmcnRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  nmcnText: { fontSize: 13, lineHeight: 19 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalCodeBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 12 },
  modalCode: { fontSize: 13, fontWeight: '700' },
  modalCredits: { fontSize: 12 },
  modalCourseTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  modalDesc: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  modalSection: { borderRadius: 14, padding: 16, marginBottom: 20 },
  modalSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  modalSectionTitle: { fontSize: 15, fontWeight: '700' },
  modalStudyText: { fontSize: 13, lineHeight: 19 },
  studyAiBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  studyAiBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
