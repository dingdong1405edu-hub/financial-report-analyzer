import { Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { ReportJSON } from '@/types/report'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#1e3a5f',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#2e86de',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#2e86de',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  reportLabel: {
    fontSize: 11,
    color: '#2e86de',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  companyName: {
    fontSize: 32,
    fontFamily: 'NotoSans', fontWeight: 700,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  divider: {
    width: 80,
    height: 3,
    backgroundColor: '#2e86de',
    marginVertical: 20,
  },
  title: {
    fontSize: 18,
    color: '#a8c8f0',
    textAlign: 'center',
    marginBottom: 8,
  },
  period: {
    fontSize: 14,
    color: '#7fb3e0',
    textAlign: 'center',
    marginBottom: 40,
  },
  metaBox: {
    borderWidth: 1,
    borderColor: '#2e86de',
    borderRadius: 4,
    padding: 16,
    marginTop: 20,
    minWidth: 280,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 9,
    color: '#7fb3e0',
    width: 100,
  },
  metaValue: {
    fontSize: 9,
    color: '#ffffff',
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#4a7aaa',
  },
})

interface Props {
  reportJSON: Partial<ReportJSON>
}

export default function CoverPage({ reportJSON }: Props) {
  const meta = reportJSON.metadata
  const company = meta?.companyName ?? 'Báo Cáo Tài Chính'
  const period = meta?.reportPeriod ?? ''
  const currency = meta?.currency ?? 'VND'
  const generatedAt = meta?.generatedAt
    ? new Date(meta.generatedAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('vi-VN')
  const fileName = meta?.fileName ?? ''

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.topBar} />
      <View style={styles.content}>
        <Text style={styles.reportLabel}>Báo Cáo Phân Tích</Text>
        <Text style={styles.companyName}>{company}</Text>
        <View style={styles.divider} />
        <Text style={styles.title}>Phân Tích Tài Chính Toàn Diện</Text>
        {period ? <Text style={styles.period}>{period}</Text> : null}
        <View style={styles.metaBox}>
          {fileName ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Tệp nguồn:</Text>
              <Text style={styles.metaValue}>{fileName}</Text>
            </View>
          ) : null}
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Đơn vị tiền tệ:</Text>
            <Text style={styles.metaValue}>{currency}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Ngày tạo:</Text>
            <Text style={styles.metaValue}>{generatedAt}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Công cụ:</Text>
            <Text style={styles.metaValue}>AI Financial Analyzer</Text>
          </View>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Được tạo tự động bởi hệ thống phân tích AI</Text>
      </View>
      <View style={styles.bottomBar} />
    </Page>
  )
}
