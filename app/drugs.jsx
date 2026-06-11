import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, useColorScheme, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, DarkColors } from '../constants/theme';
import { drugsApi } from '../services/api';

export default function Drugs() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? DarkColors : Colors;

  const [drugs, setDrugs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => { loadDrugs(); }, []);

  async function loadDrugs(q = '') {
    setLoading(true);
    try {
      const data = await drugsApi.getAll(q);
      setDrugs(data);
    } catch { setDrugs([]); } finally { setLoading(false); }
  }

  function handleSearch(text) {
    setSearch(text);
    if (text.length > 1) loadDrugs(text);
    else if (text.length === 0) loadDrugs();
  }

  function DrugDetail({ drug }) {
    return (
      <View style={[styles.detailCard, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => setSelected(null)} style={styles.backToResults}>
          <Ionicons name="arrow-back" size={18} color={theme.primary} />
          <Text style={[styles.backText, { color: theme.primary }]}>Back to results</Text>
        </TouchableOpacity>
        <Text style={[styles.drugName, { color: theme.text }]}>{drug.name}</Text>
        <Text style={[styles.genericName, { color: theme.textSecondary }]}>{drug.genericName}</Text>
        <View style={[styles.badge, { backgroundColor: theme.primary + '15' }]}>
          <Text style={[styles.badgeText, { color: theme.primary }]}>{drug.category}</Text>
        </View>

        <DetailSection theme={theme} title="Dosages" items={drug.dosages} />
        <DetailSection theme={theme} title="Routes" items={drug.routes} />
        <DetailSection theme={theme} title="Indications" items={drug.indications} />
        <DetailSection theme={theme} title="Side Effects" items={drug.sideEffects} color={theme.error} />
        <DetailSection theme={theme} title="Nursing Considerations" items={drug.nursingConsiderations} color={theme.warning} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Drug Reference</Text>
        <TouchableOpacity onPress={() => loadDrugs()}>
          <Ionicons name="refresh" size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBar, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
        <Ionicons name="search" size={18} color={theme.textLight} />
        <TextInput style={[styles.searchInput, { color: theme.text }]} value={search} onChangeText={handleSearch} placeholder="Search medications..." placeholderTextColor={theme.textLight} />
      </View>

      {selected ? (
        <DrugDetail drug={selected} />
      ) : loading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
      ) : (
        <FlatList data={drugs} keyExtractor={(item) => item.name} contentContainerStyle={styles.list} renderItem={({ item }) => (
          <TouchableOpacity style={[styles.drugCard, { backgroundColor: theme.surface }]} onPress={() => setSelected(item)}>
            <View style={styles.drugInfo}>
              <Text style={[styles.drugName, { color: theme.text }]}>{item.name}</Text>
              <Text style={[styles.drugGeneric, { color: theme.textSecondary }]}>{item.genericName} · {item.category}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textLight} />
          </TouchableOpacity>
        )} />
      )}
    </View>
  );
}

function DetailSection({ theme, title, items, color }) {
  return items?.length ? (
    <View style={styles.detailSection}>
      <Text style={[styles.detailTitle, { color: color || theme.textSecondary }]}>{title}</Text>
      {items.map((item, i) => (
        <View key={i} style={styles.detailItem}>
          <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
          <Text style={[styles.detailText, { color: theme.text }]}>{item}</Text>
        </View>
      ))}
    </View>
  ) : null;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 15 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  drugCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 8 },
  drugInfo: { flex: 1 },
  drugName: { fontSize: 16, fontWeight: '600' },
  drugGeneric: { fontSize: 12, marginTop: 2 },
  detailCard: { margin: 16, borderRadius: 16, padding: 20 },
  backToResults: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backText: { fontSize: 14, fontWeight: '500' },
  genericName: { fontSize: 14, marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 16 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  detailSection: { marginBottom: 14 },
  detailTitle: { fontSize: 13, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  detailItem: { flexDirection: 'row', gap: 6, marginBottom: 2 },
  bullet: { fontSize: 14 },
  detailText: { fontSize: 14, flex: 1, lineHeight: 20 },
});
