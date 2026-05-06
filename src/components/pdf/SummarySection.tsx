import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { ReportJSON } from '@/types/report'

const NAVY = '#1e3a5f'
const ACCENT = '#2e86de'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 48,
    fontFamily: 'NotoSans',
  },
  sectionHeader: {
    backgroundColor: NAVY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    borderRadius: 2,
  },
  sectionHeaderText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'NotoSans', fontWeight: 700,
    letterSpacing: 0.5,
  },
  paragraph: {
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.6,
    marginBottom: 12,
  },
  swotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  swotBox: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 4,
    padding: 12,
  },
  swotTitle: {
    fontSize: 10,
    fontFamily: 'NotoSans', fontWeight: 700,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  swotItem: {
    fontSize: 9,
    color: '#444444',
    marginBottom: 3,
    paddingLeft: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f5f8ff',
    padding: 12,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: ACCENT,
  },
  ratingLabel: {
    fontSize: 11,
    color: '#555555',
    flex: 1,
  },
  ratingValue: {
    fontSize: 22,
    fontFamily: 'NotoSans', fontWeight: 700,
    color: NAVY,
  },
  ratingMax: {
    fontSize: 11,
    color: '#888888',
    marginTop: 4,
  },
  subsectionTitle: {
    fontSize: 11,
    fontFamily: 'NotoSans', fontWeight: 700,
    color: NAVY,
    marginBottom: 8,
    marginTop: 12,
  },
  recommendationBox: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  priorityBadge: {
    fontSize: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
    fontFamily: 'NotoSans', fontWeight: 700,
  },
  recAction: {
    fontSize: 10,
    fontFamily: 'NotoSans', fontWeight: 700,
    color: '#222222',
    flex: 1,
  },
  recRationale: {
    fontSize: 9,
    color: '#555555',
    lineHeight: 1.5,
  },
  recTimeframe: {
    fontSize: 8,
    color: '#888888',
    marginTop: 3,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 24,
    right: 48,
    fontSize: 9,
    color: '#aaaaaa',
  },
})

const priorityColors: Record<string, { bg: string; text: string }> = {
  Urgent: { bg: '#fde8e8', text: '#c0392b' },
  High: { bg: '#fef3cd', text: '#e67e22' },
  Medium: { bg: '#e8f4fd', text: '#2980b9' },
  Low: { bg: '#eafaf1', text: '#27ae60' },
}

interface Props {
  reportJSON: Partial<ReportJSON>
}

export default function SummarySection({ reportJSON }: Props) {
  const synthesis = reportJSON.synthesis
  if (!synthesis) return null

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>TỔNG HỢP & ĐÁNH GIÁ</Text>
      </View>

      {synthesis.overallRating != null && (
        <View style={styles.ratingRow}>
          <Text style={styles.ratingLabel}>Đánh giá tổng thể doanh nghiệp</Text>
          <View>
            <Text style={styles.ratingValue}>{synthesis.overallRating}</Text>
            <Text style={styles.ratingMax}>/10</Text>
          </View>
        </View>
      )}

      {synthesis.executiveSummary ? (
        <>
          <Text style={styles.subsectionTitle}>Tóm Tắt Điều Hành</Text>
          <Text style={styles.paragraph}>{synthesis.executiveSummary}</Text>
        </>
      ) : null}

      {(synthesis.strengths?.length > 0 ||
        synthesis.weaknesses?.length > 0 ||
        synthesis.opportunities?.length > 0 ||
        synthesis.threats?.length > 0) && (
        <>
          <Text style={styles.subsectionTitle}>Phân Tích SWOT</Text>
          <View style={styles.swotGrid}>
            {synthesis.strengths?.length > 0 && (
              <View style={[styles.swotBox, { borderTopWidth: 3, borderTopColor: '#27ae60' }]}>
                <Text style={[styles.swotTitle, { color: '#27ae60' }]}>Điểm Mạnh</Text>
                {synthesis.strengths.map((s, i) => (
                  <Text key={i} style={styles.swotItem}>• {s}</Text>
                ))}
              </View>
            )}
            {synthesis.weaknesses?.length > 0 && (
              <View style={[styles.swotBox, { borderTopWidth: 3, borderTopColor: '#e74c3c' }]}>
                <Text style={[styles.swotTitle, { color: '#e74c3c' }]}>Điểm Yếu</Text>
                {synthesis.weaknesses.map((s, i) => (
                  <Text key={i} style={styles.swotItem}>• {s}</Text>
                ))}
              </View>
            )}
            {synthesis.opportunities?.length > 0 && (
              <View style={[styles.swotBox, { borderTopWidth: 3, borderTopColor: ACCENT }]}>
                <Text style={[styles.swotTitle, { color: ACCENT }]}>Cơ Hội</Text>
                {synthesis.opportunities.map((s, i) => (
                  <Text key={i} style={styles.swotItem}>• {s}</Text>
                ))}
              </View>
            )}
            {synthesis.threats?.length > 0 && (
              <View style={[styles.swotBox, { borderTopWidth: 3, borderTopColor: '#e67e22' }]}>
                <Text style={[styles.swotTitle, { color: '#e67e22' }]}>Thách Thức</Text>
                {synthesis.threats.map((s, i) => (
                  <Text key={i} style={styles.swotItem}>• {s}</Text>
                ))}
              </View>
            )}
          </View>
        </>
      )}

      {synthesis.recommendations?.length > 0 && (
        <>
          <Text style={styles.subsectionTitle}>Khuyến Nghị Hành Động</Text>
          {synthesis.recommendations.map((rec, i) => {
            const colors = priorityColors[rec.priority] ?? priorityColors.Medium
            return (
              <View key={i} style={styles.recommendationBox}>
                <View style={styles.recHeader}>
                  <Text style={[styles.priorityBadge, { backgroundColor: colors.bg, color: colors.text }]}>
                    {rec.priority}
                  </Text>
                  <Text style={styles.recAction}>{rec.action}</Text>
                </View>
                <Text style={styles.recRationale}>{rec.rationale}</Text>
                <Text style={styles.recTimeframe}>Thời gian: {rec.timeframe}</Text>
              </View>
            )
          })}
        </>
      )}

      {synthesis.conclusion ? (
        <>
          <Text style={styles.subsectionTitle}>Kết Luận</Text>
          <Text style={styles.paragraph}>{synthesis.conclusion}</Text>
        </>
      ) : null}

      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
    </Page>
  )
}
