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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  card: {
    width: '30%',
    margin: '1.5%',
    padding: 8,
    backgroundColor: '#f5f7fa',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#dde3ea',
  },
  cardLabel: { fontSize: 8, color: '#666', marginBottom: 4 },
  cardValue: { fontSize: 16, fontWeight: 'bold', color: '#1e3a5f' },
  cardValueGood: { fontSize: 16, fontWeight: 'bold', color: '#27ae60' },
  cardValueBad: { fontSize: 16, fontWeight: 'bold', color: '#e74c3c' },
  cardValueNull: { fontSize: 14, fontWeight: 'bold', color: '#aaa' },
  analysis: {
    marginTop: 4,
    marginHorizontal: 12,
    padding: 10,
    backgroundColor: '#f0f4f8',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#2e86de',
  },
  analysisText: { fontSize: 10, color: '#444', lineHeight: 1.6 },
})

interface RatioCardProps {
  label: string
  value: number | null
  unit?: string
  goodThreshold?: { min?: number; max?: number }
}

function RatioCard({ label, value, unit = '', goodThreshold }: RatioCardProps) {
  let valueStyle = styles.cardValue

  if (value !== null && goodThreshold) {
    const { min, max } = goodThreshold
    const isGood = (min === undefined || value >= min) && (max === undefined || value <= max)
    valueStyle = isGood ? styles.cardValueGood : styles.cardValueBad
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      {value !== null ? (
        <Text style={valueStyle}>{value.toFixed(2)}{unit}</Text>
      ) : (
        <Text style={styles.cardValueNull}>N/A</Text>
      )}
    </View>
  )
}

interface Props {
  reportJSON: Partial<ReportJSON>
}

export default function RatioSection({ reportJSON }: Props) {
  const ratios = reportJSON.ratios
  if (!ratios) return null

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.headerText}>CHỈ SỐ TÀI CHÍNH</Text>
      </View>

      <View style={styles.grid}>
        <RatioCard
          label="Current Ratio"
          value={ratios.currentRatio}
          goodThreshold={{ min: 1.5 }}
        />
        <RatioCard
          label="Quick Ratio"
          value={ratios.quickRatio}
          goodThreshold={{ min: 1.0 }}
        />
        <RatioCard
          label="ROE"
          value={ratios.roe}
          unit="%"
          goodThreshold={{ min: 10 }}
        />
        <RatioCard
          label="ROA"
          value={ratios.roa}
          unit="%"
          goodThreshold={{ min: 5 }}
        />
        <RatioCard
          label="Debt Ratio"
          value={ratios.debtRatio}
          unit="%"
          goodThreshold={{ max: 60 }}
        />
        {ratios.peRatio !== null && (
          <RatioCard
            label="P/E Ratio"
            value={ratios.peRatio}
          />
        )}
      </View>

      <View style={styles.analysis}>
        <Text style={styles.analysisText}>{ratios.analysis}</Text>
      </View>
    </View>
  )
}
