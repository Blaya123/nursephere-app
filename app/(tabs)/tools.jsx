import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, DarkColors } from '../../constants/theme';

export default function Tools() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? DarkColors : Colors;

  const tools = [
    {
      icon: 'calculator',
      title: 'Dosage Calculator',
      desc: 'Weight-based, IV drip rate, BSA calculations with history tracking',
      color: '#3B82F6',
      gradient: ['#3B82F6', '#2563EB'],
      route: '/dosage',
    },
    {
      icon: 'search',
      title: 'NANDA-I Diagnosis',
      desc: 'AI-powered nursing diagnosis from symptom description',
      color: '#F59E0B',
      gradient: ['#F59E0B', '#D97706'],
      route: '/diagnosis',
    },
    {
      icon: 'medkit',
      title: 'Drug Reference',
      desc: '170+ medications with dosages, routes, and side effects',
      color: '#EF4444',
      gradient: ['#EF4444', '#DC2626'],
      route: '/drugs',
    },
    {
      icon: 'book',
      title: 'Nursing Guides',
      desc: 'Step-by-step clinical procedure guides powered by AI',
      color: '#8B5CF6',
      gradient: ['#8B5CF6', '#7C3AED'],
      route: '/guides',
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
        <Text style={styles.headerTitle}>Clinical Tools</Text>
        <Text style={styles.headerSub}>Everything you need, in one place</Text>
      </LinearGradient>

      <View style={styles.grid}>
        {tools.map((tool, i) => (
          <TouchableOpacity key={i} style={[styles.card, { backgroundColor: theme.surface }]} onPress={() => router.push(tool.route)} activeOpacity={0.7}>
            <LinearGradient colors={tool.gradient} style={styles.cardIcon}>
              <Ionicons name={tool.icon} size={28} color="#fff" />
            </LinearGradient>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{tool.title}</Text>
            <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>{tool.desc}</Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.cardAction, { color: tool.color }]}>Open</Text>
              <Ionicons name="arrow-forward" size={16} color={tool.color} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoSection}>
        <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
          <Ionicons name="information-circle" size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>All clinical tools are powered by Google Gemini AI and are intended for educational purposes. Always verify with standard clinical references.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 28, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  grid: { padding: 16, gap: 16 },
  card: { borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  cardIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  cardDesc: { fontSize: 13, lineHeight: 18, marginBottom: 14 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardAction: { fontSize: 14, fontWeight: '600' },
  infoSection: { paddingHorizontal: 16, paddingBottom: 32 },
  infoCard: { flexDirection: 'row', gap: 10, padding: 16, borderRadius: 16, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
