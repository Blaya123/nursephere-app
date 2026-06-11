import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, useColorScheme, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, DarkColors } from '../constants/theme';
import { aiApi } from '../services/api';

const SUGGESTED_GUIDES = [
  'IV Cannulation',
  'Male Catheterization',
  'Female Catheterization',
  'Intramuscular Injection',
  'Subcutaneous Injection',
  'Blood Pressure Measurement',
  'Wound Dressing',
  'Nasogastric Tube Insertion',
  'Oxygen Therapy',
  'CPR',
];

export default function Guides() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? DarkColors : Colors;

  const [query, setQuery] = useState('');
  const [guide, setGuide] = useState('');
  const [loading, setLoading] = useState(false);

  async function generateGuide(name) {
    const searchTerm = name || query;
    if (!searchTerm.trim()) return;
    setLoading(true);
    setGuide('');
    try {
      const data = await aiApi.procedure(searchTerm);
      setGuide(data.response);
    } catch {
      setGuide('Unable to generate guide. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Nursing Guides</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        <View style={[styles.searchCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.searchBar, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <TextInput style={[styles.searchInput, { color: theme.text }]} value={query} onChangeText={setQuery} placeholder="Search a procedure..." placeholderTextColor={theme.textLight} />
            <TouchableOpacity style={[styles.searchBtn, { backgroundColor: theme.primary }]} onPress={() => generateGuide()} disabled={loading}>
              <Ionicons name="search" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.suggestTitle, { color: theme.textSecondary }]}>Common procedures:</Text>
        <View style={styles.chipsRow}>
          {SUGGESTED_GUIDES.map((g, i) => (
            <TouchableOpacity key={i} style={[styles.chip, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]} onPress={() => generateGuide(g)}>
              <Text style={[styles.chipText, { color: theme.text }]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && (
          <View style={[styles.loadingCard, { backgroundColor: theme.surface }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Generating guide...</Text>
          </View>
        )}

        {guide ? (
          <View style={[styles.guideCard, { backgroundColor: theme.surface }]}>
            <View style={styles.guideHeader}>
              <Ionicons name="book" size={20} color={theme.primary} />
              <Text style={[styles.guideTitle, { color: theme.text }]}>Procedure Guide</Text>
            </View>
            <Text style={[styles.guideText, { color: theme.text }]}>{guide}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  body: { padding: 16, gap: 16 },
  searchCard: { borderRadius: 16, padding: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingLeft: 14, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 10 },
  searchBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', margin: 4 },
  suggestTitle: { fontSize: 14, fontWeight: '500' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '500' },
  loadingCard: { borderRadius: 16, padding: 32, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14 },
  guideCard: { borderRadius: 16, padding: 20 },
  guideHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  guideTitle: { fontSize: 16, fontWeight: '600' },
  guideText: { fontSize: 14, lineHeight: 22 },
});
