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
  valueWarning: { flex: 1, fontSize: 10, textAlign: 'right', color: '#e67e22' },
  analysis: {
    marginTop: 8,
    marginHorizontal: 12,
    padding: 10,
    backgroundColor: '#f0f4f8',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#1e3a5f',
  },
  analysisText: { fontSize: 10, color: '#444', lineHeight: 1.6 },
  highlightRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e8f4fd',
    borderBottomWidth: 1,
    borderBottomColor: '#c8dff0',
  },
  highlightLabel: { flex: 2, fontSize: 11, fontWeight: 'bold', color: '#1e3a5f' },
  highlightValue: { flex: 1, fontSize: 11, fontWeight: 'bold', textAlign: 'right', color: '#2e86de' },
  equityRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e8f8f0',
    borderBottomWidth: 1,
    borderBottomColor: '#c0e8d0',
  },
  equityLabel: { flex: 2, fontSize: 11, fontWeight: 'bold', color: '#1e3a5f' },
  equityValue: { flex: 1, fontSize: 11, fontWeight: 'bold', textAlign: 'right', color: '#27ae60' },
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

export default function BalanceSection({ reportJSON }: Props) {
  const bal = reportJSON.balance
  if (!bal) return null

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.headerText}>CÂN ĐỐI KẾ TOÁN</Text>
      </View>

      <View style={styles.highlightRow}>
        <Text style={styles.highlightLabel}>Tổng Tài Sản</Text>
        <Text style={styles.highlightValue}>{formatNumber(bal.totalAssets)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Tổng Nợ Phải Trả</Text>
        <Text style={styles.value}>{formatNumber(bal.totalLiabilities)}</Text>
      </View>

      <View style={styles.equityRow}>
        <Text style={styles.equityLabel}>Vốn Chủ Sở Hữu</Text>
        <Text style={styles.equityValue}>{formatNumber(bal.equity)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Hệ số Nợ / Vốn chủ sở hữu (D/E)</Text>
        <Text style={bal.debtToEquity > 2 ? styles.valueWarning : styles.value}>
          {bal.debtToEquity.toFixed(2)}x
        </Text>
      </View>

      <View style={styles.analysis}>
        <Text style={styles.analysisText}>{bal.analysis}</Text>
      </View>
    </View>
  )
}
