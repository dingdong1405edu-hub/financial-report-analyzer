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
  valuePositive: { flex: 1, fontSize: 10, textAlign: 'right', color: '#27ae60' },
  valueNegative: { flex: 1, fontSize: 10, textAlign: 'right', color: '#e74c3c' },
  value: { flex: 1, fontSize: 10, textAlign: 'right', color: '#333' },
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
  highlightRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e8f4fd',
    borderBottomWidth: 1,
    borderBottomColor: '#c8dff0',
  },
  highlightLabel: { flex: 2, fontSize: 11, fontWeight: 'bold', color: '#1e3a5f' },
  highlightValuePos: { flex: 1, fontSize: 11, fontWeight: 'bold', textAlign: 'right', color: '#27ae60' },
  highlightValueNeg: { flex: 1, fontSize: 11, fontWeight: 'bold', textAlign: 'right', color: '#e74c3c' },
})

function formatNumber(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : '+'
  if (abs >= 1_000_000_000) return sign + (abs / 1_000_000_000).toFixed(1) + ' tỷ'
  if (abs >= 1_000_000) return sign + (abs / 1_000_000).toFixed(1) + ' triệu'
  if (abs >= 1_000) return sign + (abs / 1_000).toFixed(1) + ' nghìn'
  return (n >= 0 ? '+' : '') + n.toFixed(0)
}

interface Props {
  reportJSON: Partial<ReportJSON>
}

export default function CashflowSection({ reportJSON }: Props) {
  const cf = reportJSON.cashflow
  if (!cf) return null

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.headerText}>PHÂN TÍCH DÒNG TIỀN</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Dòng tiền từ hoạt động kinh doanh</Text>
        <Text style={cf.operatingCashflow >= 0 ? styles.valuePositive : styles.valueNegative}>
          {formatNumber(cf.operatingCashflow)}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Dòng tiền từ hoạt động đầu tư</Text>
        <Text style={cf.investingCashflow >= 0 ? styles.valuePositive : styles.valueNegative}>
          {formatNumber(cf.investingCashflow)}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Dòng tiền từ hoạt động tài chính</Text>
        <Text style={cf.financingCashflow >= 0 ? styles.valuePositive : styles.valueNegative}>
          {formatNumber(cf.financingCashflow)}
        </Text>
      </View>

      <View style={styles.highlightRow}>
        <Text style={styles.highlightLabel}>Dòng Tiền Thuần</Text>
        <Text style={cf.netCashflow >= 0 ? styles.highlightValuePos : styles.highlightValueNeg}>
          {formatNumber(cf.netCashflow)}
        </Text>
      </View>

      <View style={styles.analysis}>
        <Text style={styles.analysisText}>{cf.analysis}</Text>
      </View>
    </View>
  )
}
