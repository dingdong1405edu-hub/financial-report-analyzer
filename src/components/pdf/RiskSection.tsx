import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { ReportJSON } from '@/types/report'

const RISK_COLORS: Record<string, string> = {
  Low: '#27ae60',
  Medium: '#f39c12',
  High: '#e74c3c',
  Critical: '#8e0000',
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
  riskLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  riskLevelLabel: { fontSize: 12, color: '#333', flex: 1 },
  riskBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  riskBadgeText: { fontSize: 12, fontWeight: 'bold', color: 'white' },
  riskItem: {
    marginHorizontal: 12,
    marginBottom: 6,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    borderLeftWidth: 3,
  },
  riskCategory: { fontSize: 10, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  riskDescription: { fontSize: 9, color: '#555', lineHeight: 1.5 },
  mitigationSection: {
    marginTop: 8,
    marginHorizontal: 12,
  },
  mitigationTitle: { fontSize: 10, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 4 },
  mitigationItem: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 4,
  },
  bullet: { fontSize: 9, color: '#2e86de', marginRight: 4 },
  mitigationText: { fontSize: 9, color: '#444', flex: 1, lineHeight: 1.5 },
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
})

interface Props {
  reportJSON: Partial<ReportJSON>
}

export default function RiskSection({ reportJSON }: Props) {
  const risks = reportJSON.risks
  if (!risks) return null

  const riskColor = RISK_COLORS[risks.riskLevel] ?? '#f39c12'

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.headerText}>ĐÁNH GIÁ RỦI RO</Text>
      </View>

      <View style={styles.riskLevelRow}>
        <Text style={styles.riskLevelLabel}>Mức độ rủi ro tổng thể:</Text>
        <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
          <Text style={styles.riskBadgeText}>{risks.riskLevel}</Text>
        </View>
      </View>

      {risks.identifiedRisks.map((risk, i) => {
        const borderColor = RISK_COLORS[risk.severity] ?? '#f39c12'
        return (
          <View key={i} style={[styles.riskItem, { borderLeftColor: borderColor }]}>
            <Text style={styles.riskCategory}>{risk.category} — {risk.severity}</Text>
            <Text style={styles.riskDescription}>{risk.description}</Text>
          </View>
        )
      })}

      {risks.mitigations.length > 0 && (
        <View style={styles.mitigationSection}>
          <Text style={styles.mitigationTitle}>Biện pháp giảm thiểu rủi ro:</Text>
          {risks.mitigations.map((m, i) => (
            <View key={i} style={styles.mitigationItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.mitigationText}>{m}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.analysis}>
        <Text style={styles.analysisText}>{risks.analysis}</Text>
      </View>
    </View>
  )
}
