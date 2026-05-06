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
  valuePositive: { flex: 1, fontSize: 10, textAlign: 'right', color: '#27ae60' },
  valueNegative: { flex: 1, fontSize: 10, textAlign: 'right', color: '#e74c3c' },
  analysis: {
    marginTop: 8,
    marginHorizontal: 12,
    padding: 10,
    backgroundColor: '#f0fff4',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#27ae60',
  },
  analysisText: { fontSize: 10, color: '#444', lineHeight: 1.6 },
  highlightRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e8f8f0',
    borderBottomWidth: 1,
    borderBottomColor: '#c0e8d0',
  },
  highlightLabel: { flex: 2, fontSize: 11, fontWeight: 'bold', color: '#1e3a5f' },
  highlightValue: { flex: 1, fontSize: 11, fontWeight: 'bold', textAlign: 'right', color: '#27ae60' },
  highlightValueNeg: { flex: 1, fontSize: 11, fontWeight: 'bold', textAlign: 'right', color: '#e74c3c' },
  marginRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#f8f8f8',
  },
  marginLabel: { flex: 2, fontSize: 9, color: '#666', fontStyle: 'italic' },
  marginValue: { flex: 1, fontSize: 9, textAlign: 'right', color: '#666' },
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

export default function ProfitSection({ reportJSON }: Props) {
  const profit = reportJSON.profit
  if (!profit) return null

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.headerText}>PHÂN TÍCH LỢI NHUẬN</Text>
      </View>

      <View style={[styles.highlightRow]}>
        <Text style={styles.highlightLabel}>Lợi Nhuận Gộp</Text>
        <Text style={profit.grossProfit >= 0 ? styles.highlightValue : styles.highlightValueNeg}>
          {formatNumber(profit.grossProfit)}
        </Text>
      </View>
      <View style={styles.marginRow}>
        <Text style={styles.marginLabel}>Biên lợi nhuận gộp</Text>
        <Text style={styles.marginValue}>{profit.grossMargin.toFixed(1)}%</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Lợi nhuận hoạt động</Text>
        <Text style={profit.operatingProfit >= 0 ? styles.valuePositive : styles.valueNegative}>
          {formatNumber(profit.operatingProfit)}
        </Text>
      </View>

      <View style={[styles.highlightRow]}>
        <Text style={styles.highlightLabel}>Lợi Nhuận Ròng</Text>
        <Text style={profit.netProfit >= 0 ? styles.highlightValue : styles.highlightValueNeg}>
          {formatNumber(profit.netProfit)}
        </Text>
      </View>
      <View style={styles.marginRow}>
        <Text style={styles.marginLabel}>Biên lợi nhuận ròng</Text>
        <Text style={styles.marginValue}>{profit.netMargin.toFixed(1)}%</Text>
      </View>

      <View style={styles.analysis}>
        <Text style={styles.analysisText}>{profit.analysis}</Text>
      </View>
    </View>
  )
}
