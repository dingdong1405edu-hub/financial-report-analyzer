import { Document, Page, StyleSheet } from '@react-pdf/renderer'
import type { ReportJSON } from '@/types/report'
import CoverPage from './CoverPage'
import ParsedSection from './ParsedSection'
import SummarySection from './SummarySection'
import RevenueSection from './RevenueSection'
import CostSection from './CostSection'
import ProfitSection from './ProfitSection'
import CashflowSection from './CashflowSection'
import BalanceSection from './BalanceSection'
import RatioSection from './RatioSection'
import TrendSection from './TrendSection'
import RiskSection from './RiskSection'
import RecommendationSection from './RecommendationSection'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontFamily: 'NotoSans',
  },
})

interface Props {
  reportJSON: Partial<ReportJSON>
}

export default function ReportDocument({ reportJSON }: Props) {
  const hasAnalysis =
    reportJSON.revenue ||
    reportJSON.costs ||
    reportJSON.profit ||
    reportJSON.cashflow ||
    reportJSON.balance ||
    reportJSON.ratios ||
    reportJSON.trends ||
    reportJSON.risks

  return (
    <Document
      title={`Báo cáo tài chính - ${reportJSON.metadata?.companyName ?? 'Phân tích'}`}
      author="AI Financial Analyzer"
      subject="Phân Tích Tài Chính"
    >
      {/* Page 1: Cover */}
      <CoverPage reportJSON={reportJSON} />

      {/* Page 2: Executive Summary + SWOT + Recommendations (Agent 10) */}
      {reportJSON.synthesis && <SummarySection reportJSON={reportJSON} />}

      {/* Page 3: Document Overview (Agent 1) */}
      {(reportJSON.parsed || reportJSON.metadata) && <ParsedSection reportJSON={reportJSON} />}

      {/* Pages 4+: Financial Analysis Sections (Agents 2-9) */}
      {hasAnalysis && (
        <Page size="A4" style={styles.page}>
          <RevenueSection reportJSON={reportJSON} />
          <CostSection reportJSON={reportJSON} />
          <ProfitSection reportJSON={reportJSON} />
          <CashflowSection reportJSON={reportJSON} />
          <BalanceSection reportJSON={reportJSON} />
          <RatioSection reportJSON={reportJSON} />
          <TrendSection reportJSON={reportJSON} />
          <RiskSection reportJSON={reportJSON} />
          <RecommendationSection reportJSON={reportJSON} />
        </Page>
      )}
    </Document>
  )
}
