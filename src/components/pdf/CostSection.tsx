import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { ReportJSON } from '@/types/report'

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  header: {
    backgroundColor: '#1e3a5f',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  headerText: { color: 'white', fontSize: 13, fontWeight: 'bold' },
  row: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8ecf0',
  },
  label: { flex: 2, fontSize: 10, color: '#333' },
  value: { flex: 1, fontSize: 10, textAlign: 'right', color: '#333' },
  valueWarning: { flex: 1, fontSize: 10, textAlign: 'right', color: '#e74c3c' },
  analysis: {
    marginTop: 8,
    marginHorizontal: 12,
    padding: 10,
    backgroundColor: '#fff5f5',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#e74c3c',
  },
  analysisText: { fontSize: 10, color: '#444', lineHeight: 1.6 },
  subHeader: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: '#f5f7fa',
  },
  subHeaderText: { flex: 2, fontSize: 9, color: '#666', fontWeight: 'bold' },
  subHeaderValue: { flex: 1, fontSize: 9, color: '#666', fontWeight: 'bold', textAlign: 'right' },
  highlightRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fff0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ffd0d0',
  },
  highlightLabel: { flex: 2, fontSize: 11, fontWeight: 'bold', color: '#1e3a5f' },
  highlightValue: { flex: 1, fontSize: 11, fontWeight: 'bold', textAlign: 'right', color: '#e74c3c' },
})

function formatNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + ' tỷ'
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' triệu'
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + ' nghìn'
  return n.toFixed(0)
}

interface Props {
  reportJSON: Partial<ReportJSON>
}

export default function CostSection({ reportJSON }: Props) {
  const costs = reportJSON.costs
  if (!costs) return null

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.headerText}>PHÂN TÍCH CHI PHÍ</Text>
      </View>

      <View style={styles.highlightRow}>
        <Text style={styles.highlightLabel}>Tổng Chi Phí</Text>
        <Text style={styles.highlightValue}>{formatNumber(costs.totalCosts)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Tỷ lệ chi phí / doanh thu</Text>
        <Text style={costs.costRatio > 80 ? styles.valueWarning : styles.value}>
          {costs.costRatio.toFixed(1)}%
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Chi phí lớn nhất</Text>
        <Text style={styles.value}>{costs.majorCostDriver}</Text>
      </View>

      {costs.costBreakdown.length > 0 && (
        <>
          <View style={styles.subHeader}>
            <Text style={styles.subHeaderText}>Cơ cấu chi phí</Text>
            <Text style={styles.subHeaderValue}>Tỷ trọng</Text>
          </View>
          {costs.costBreakdown.map((item, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.label}>{item.name}</Text>
              <Text style={styles.value}>{item.percentage.toFixed(1)}%</Text>
            </View>
          ))}
        </>
      )}

      <View style={styles.analysis}>
        <Text style={styles.analysisText}>{costs.analysis}</Text>
      </View>
    </View>
  )
}
