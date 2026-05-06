import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { ReportJSON } from '@/types/report'

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: '#8e0000',
  High: '#e74c3c',
  Medium: '#f39c12',
  Low: '#27ae60',
}

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  header: {
    backgroundColor: '#1e3a5f',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  headerText: { color: 'white', fontSize: 13, fontWeight: 'bold' },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#e8f4fd',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#c8dff0',
  },
  ratingLabel: { fontSize: 12, color: '#1e3a5f', fontWeight: 'bold', flex: 1 },
  ratingValue: { fontSize: 24, fontWeight: 'bold', color: '#2e86de' },
  ratingMax: { fontSize: 14, color: '#666' },
  swotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  swotBox: {
    width: '46%',
    margin: '2%',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  swotTitle: { fontSize: 9, fontWeight: 'bold', marginBottom: 4 },
  swotItem: { flexDirection: 'row', marginBottom: 2 },
  swotBullet: { fontSize: 8, marginRight: 3 },
  swotText: { fontSize: 8, flex: 1, lineHeight: 1.4 },
  recTitle: {
    paddingHorizontal: 12,
    paddingBottom: 4,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e3a5f',
  },
  recItem: {
    marginHorizontal: 12,
    marginBottom: 6,
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    backgroundColor: '#f8f9fa',
  },
  recHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  recPriority: {
    fontSize: 8,
    fontWeight: 'bold',
    color: 'white',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 6,
  },
  recAction: { fontSize: 10, fontWeight: 'bold', color: '#333', flex: 1 },
  recRationale: { fontSize: 9, color: '#555', lineHeight: 1.4, marginBottom: 2 },
  recTimeframe: { fontSize: 8, color: '#888', fontStyle: 'italic' },
  conclusionBox: {
    margin: 12,
    marginTop: 8,
    padding: 12,
    backgroundColor: '#1e3a5f',
    borderRadius: 6,
  },
  conclusionTitle: { fontSize: 10, fontWeight: 'bold', color: '#a8c8f0', marginBottom: 6 },
  conclusionText: { fontSize: 10, color: 'white', lineHeight: 1.7 },
})

interface Props {
  reportJSON: Partial<ReportJSON>
}

export default function RecommendationSection({ reportJSON }: Props) {
  const syn = reportJSON.synthesis
  if (!syn) return null

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.headerText}>TỔNG HỢP & KHUYẾN NGHỊ</Text>
      </View>

      <View style={styles.ratingRow}>
        <Text style={styles.ratingLabel}>Điểm đánh giá tổng thể</Text>
        <Text style={styles.ratingValue}>{syn.overallRating}</Text>
        <Text style={styles.ratingMax}>/10</Text>
      </View>

      {/* SWOT */}
      <View style={styles.swotContainer}>
        <View style={[styles.swotBox, { borderColor: '#27ae60', backgroundColor: '#f0fff4' }]}>
          <Text style={[styles.swotTitle, { color: '#27ae60' }]}>ĐIỂM MẠNH (S)</Text>
          {syn.strengths.map((s, i) => (
            <View key={i} style={styles.swotItem}>
              <Text style={styles.swotBullet}>+</Text>
              <Text style={styles.swotText}>{s}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.swotBox, { borderColor: '#e74c3c', backgroundColor: '#fff5f5' }]}>
          <Text style={[styles.swotTitle, { color: '#e74c3c' }]}>ĐIỂM YẾU (W)</Text>
          {syn.weaknesses.map((w, i) => (
            <View key={i} style={styles.swotItem}>
              <Text style={styles.swotBullet}>-</Text>
              <Text style={styles.swotText}>{w}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.swotBox, { borderColor: '#2e86de', backgroundColor: '#f0f4ff' }]}>
          <Text style={[styles.swotTitle, { color: '#2e86de' }]}>CƠ HỘI (O)</Text>
          {syn.opportunities.map((o, i) => (
            <View key={i} style={styles.swotItem}>
              <Text style={styles.swotBullet}>→</Text>
              <Text style={styles.swotText}>{o}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.swotBox, { borderColor: '#f39c12', backgroundColor: '#fffbf0' }]}>
          <Text style={[styles.swotTitle, { color: '#f39c12' }]}>THÁCH THỨC (T)</Text>
          {syn.threats.map((t, i) => (
            <View key={i} style={styles.swotItem}>
              <Text style={styles.swotBullet}>!</Text>
              <Text style={styles.swotText}>{t}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recommendations */}
      <Text style={styles.recTitle}>Khuyến nghị hành động:</Text>
      {syn.recommendations.map((rec, i) => {
        const color = PRIORITY_COLORS[rec.priority] ?? '#666'
        return (
          <View key={i} style={[styles.recItem, { borderLeftColor: color }]}>
            <View style={styles.recHeader}>
              <Text style={[styles.recPriority, { backgroundColor: color }]}>{rec.priority}</Text>
              <Text style={styles.recAction}>{rec.action}</Text>
            </View>
            <Text style={styles.recRationale}>{rec.rationale}</Text>
            <Text style={styles.recTimeframe}>Thời gian: {rec.timeframe}</Text>
          </View>
        )
      })}

      {/* Conclusion */}
      <View style={styles.conclusionBox}>
        <Text style={styles.conclusionTitle}>KẾT LUẬN</Text>
        <Text style={styles.conclusionText}>{syn.conclusion}</Text>
      </View>
    </View>
  )
}
