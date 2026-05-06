import Anthropic from '@anthropic-ai/sdk'
import type { AgentInput } from './types'
import type { ReportJSON } from '@/types/report'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Bạn là chuyên gia đánh giá rủi ro tài chính. Dựa trên toàn bộ phân tích, hãy:
1. Xác định mức độ rủi ro tổng thể: Low/Medium/High/Critical
2. Liệt kê tối đa 5 rủi ro cụ thể (tài chính, thị trường, thanh khoản, vận hành)
3. Đề xuất biện pháp giảm thiểu cho từng rủi ro
4. Phân tích rủi ro bằng tiếng Việt

Trả về JSON theo schema sau:
{
  "risks": {
    "riskLevel": "Low|Medium|High|Critical",
    "identifiedRisks": [
      {
        "category": "Rủi ro thanh khoản",
        "description": "Mô tả rủi ro cụ thể",
        "severity": "Low|Medium|High"
      }
    ],
    "mitigations": ["Biện pháp 1", "Biện pháp 2"],
    "analysis": "..."
  }
}

Chỉ trả về JSON, không có markdown code block, không giải thích.`

export async function runAgent(
  input: AgentInput,
  onProgress?: (msg: string) => void
): Promise<Partial<ReportJSON>> {
  onProgress?.('Agent 9: Đang đánh giá rủi ro...')

  const context = JSON.stringify({
    metadata: input.reportJSON.metadata,
    revenue: input.reportJSON.revenue,
    costs: input.reportJSON.costs,
    profit: input.reportJSON.profit,
    cashflow: input.reportJSON.cashflow,
    balance: input.reportJSON.balance,
    ratios: input.reportJSON.ratios,
    trends: input.reportJSON.trends,
  }, null, 2)

  const userMessage = `Đánh giá rủi ro tài chính dựa trên dữ liệu sau:

Context đã phân tích:
${context}

Nội dung gốc:
${input.rawText.slice(0, 30000)}

Chỉ trả về JSON thuần túy, không có markdown code block, không giải thích.`

  let responseText = ''

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    responseText = (message.content[0] as Anthropic.TextBlock).text
    onProgress?.('Agent 9: Đã nhận phản hồi, đang parse JSON...')
    return parseAgentResponse(responseText)
  } catch (err) {
    if (responseText) {
      try { return parseAgentResponse(responseText) } catch { /* fall through */ }
    }
    throw err
  }
}

const VALID_RISK_LEVELS = new Set(['Low', 'Medium', 'High', 'Critical'])
const VALID_SEVERITIES = new Set(['Low', 'Medium', 'High'])

function parseAgentResponse(text: string): Partial<ReportJSON> {
  let jsonText = text.trim()
  jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    const start = jsonText.indexOf('{')
    const end = jsonText.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('Không tìm thấy JSON hợp lệ')
    parsed = JSON.parse(jsonText.slice(start, end + 1))
  }

  if (!parsed.risks) return {}
  const r = parsed.risks as Record<string, unknown>

  const riskLevel = String(r.riskLevel ?? 'Medium')

  return {
    risks: {
      riskLevel: (VALID_RISK_LEVELS.has(riskLevel) ? riskLevel : 'Medium') as 'Low' | 'Medium' | 'High' | 'Critical',
      identifiedRisks: Array.isArray(r.identifiedRisks)
        ? r.identifiedRisks.map((item: Record<string, unknown>) => {
            const sev = String(item.severity ?? 'Medium')
            return {
              category: String(item.category ?? ''),
              description: String(item.description ?? ''),
              severity: (VALID_SEVERITIES.has(sev) ? sev : 'Medium') as 'Low' | 'Medium' | 'High',
            }
          })
        : [],
      mitigations: Array.isArray(r.mitigations) ? r.mitigations.map(String) : [],
      analysis: String(r.analysis ?? ''),
    },
  }
}
