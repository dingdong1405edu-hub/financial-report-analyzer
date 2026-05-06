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
  label: { flex: 1, fontSize: 10, color: '#333' },
  value: { flex: 1, fontSize: 10, textAlign: 'right', color: '#2e86de', fontWeight: 'bold' },
  analysis: {
    marginTop: 8,
    marginHorizontal: 12,
    padding: 10,
    backgroundColor: '#f0f4f8',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#2e86de',
  },
  analysisText: { fontSize: 10, color: '#444', lineHeight: 1.6 },
  forecastBox: {
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#fff9e6',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#f39c12',
  },
  forecastLabel: { fontSize: 9, color: '#f39c12', fontWeight: 'bold', marginBottom: 4 },
  forecastText: { fontSize: 10, color: '#555' },
  chartContainer: {
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  chartTitle: { fontSize: 9, color: '#666', marginBottom: 6, textAlign: 'center' },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', height: 60, paddingBottom: 4 },
  chartBar: { flex: 1, marginHorizontal: 2, backgroundColor: '#2e86de', borderRadius: 2 },
  chartLabels: { flexDirection: 'row', marginTop: 4 },
  chartLabel: { flex: 1, fontSize: 7, textAlign: 'center', color: '#666' },
})

interface Props {
  reportJSON: Partial<ReportJSON>
}

function TrendIndicator({ trend }: { trend: string }) {
  const lower = trend.toLowerCase()
  if (lower.includes('tăng') || lower.includes('growth') || lower.includes('increase')) return '↑ '
  if (lower.includes('giảm') || lower.includes('decline') || lower.includes('decrease')) return '↓ '
  return '→ '
}

export default function TrendSection({ reportJSON }: Props) {
  const trends = reportJSON.trends
  if (!trends) return null

  const chartData = trends.chartData.slice(0, 6)
  const maxVal = Math.max(...chartData.map((d) => Math.abs(d.value)), 1)

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.headerText}>XU HƯỚNG & DỰ BÁO</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Xu hướng doanh thu</Text>
        <Text style={styles.value}>
          <TrendIndicator trend={trends.revenueGrowthTrend} />{trends.revenueGrowthTrend}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Xu hướng lợi nhuận</Text>
        <Text style={styles.value}>
          <TrendIndicator trend={trends.profitTrend} />{trends.profitTrend}
        </Text>
      </View>

      {chartData.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Biểu đồ xu hướng</Text>
          <View style={styles.chartRow}>
            {chartData.map((d, i) => (
              <View
                key={i}
                style={[
                  styles.chartBar,
                  { height: Math.max(4, (Math.abs(d.value) / maxVal) * 52) },
                ]}
              />
            ))}
          </View>
          <View style={styles.chartLabels}>
            {chartData.map((d, i) => (
              <Text key={i} style={styles.chartLabel}>{d.period}</Text>
            ))}
          </View>
        </View>
      )}

      {trends.forecast && (
        <View style={styles.forecastBox}>
          <Text style={styles.forecastLabel}>DỰ BÁO</Text>
          <Text style={styles.forecastText}>{trends.forecast}</Text>
        </View>
      )}

      <View style={styles.analysis}>
        <Text style={styles.analysisText}>{trends.analysis}</Text>
      </View>
    </View>
  )
}
