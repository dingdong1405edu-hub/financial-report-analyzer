import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { ReportJSON } from '@/types/report'

const NAVY = '#1e3a5f'

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
  },
  subsectionTitle: {
    fontSize: 11,
    fontFamily: 'NotoSans', fontWeight: 700,
    color: NAVY,
    marginBottom: 8,
    marginTop: 12,
  },
  paragraph: {
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.6,
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#e8f0fe',
    color: '#1e3a5f',
    fontSize: 9,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  warningBox: {
    backgroundColor: '#fff8e1',
    borderLeftWidth: 3,
    borderLeftColor: '#f39c12',
    padding: 10,
    marginBottom: 8,
    borderRadius: 2,
  },
  warningText: {
    fontSize: 9,
    color: '#7d5a00',
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  infoLabel: {
    fontSize: 10,
    color: '#666666',
    width: 140,
  },
  infoValue: {
    fontSize: 10,
    color: '#222222',
    fontFamily: 'NotoSans', fontWeight: 700,
    flex: 1,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 24,
    right: 48,
    fontSize: 9,
    color: '#aaaaaa',
  },
})

interface Props {
  reportJSON: Partial<ReportJSON>
}

export default function ParsedSection({ reportJSON }: Props) {
  const parsed = reportJSON.parsed
  const meta = reportJSON.metadata
  if (!parsed && !meta) return null

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>THÔNG TIN TỔNG QUAN</Text>
      </View>

      {meta && (
        <>
          <Text style={styles.subsectionTitle}>Thông Tin Báo Cáo</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tên công ty:</Text>
            <Text style={styles.infoValue}>{meta.companyName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kỳ báo cáo:</Text>
            <Text style={styles.infoValue}>{meta.reportPeriod}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Đơn vị tiền tệ:</Text>
            <Text style={styles.infoValue}>{meta.currency}</Text>
          </View>
          {meta.fileName && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tệp nguồn:</Text>
              <Text style={styles.infoValue}>{meta.fileName}</Text>
            </View>
          )}
        </>
      )}

      {parsed && (
        <>
          {parsed.detectedFormat && (
            <>
              <Text style={styles.subsectionTitle}>Loại Báo Cáo</Text>
              <Text style={styles.paragraph}>{parsed.detectedFormat}</Text>
            </>
          )}

          {parsed.rawData && (
            <>
              <Text style={styles.subsectionTitle}>Tóm Tắt Nội Dung</Text>
              <Text style={styles.paragraph}>{parsed.rawData}</Text>
            </>
          )}

          {parsed.keyFields?.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Các Trường Dữ Liệu Tìm Thấy</Text>
              <View style={styles.tagRow}>
                {parsed.keyFields.map((field, i) => (
                  <Text key={i} style={styles.tag}>{field}</Text>
                ))}
              </View>
            </>
          )}

          {parsed.warnings?.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Cảnh Báo</Text>
              {parsed.warnings.map((w, i) => (
                <View key={i} style={styles.warningBox}>
                  <Text style={styles.warningText}>⚠ {w}</Text>
                </View>
              ))}
            </>
          )}
        </>
      )}

      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
    </Page>
  )
}
