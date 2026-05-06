import Anthropic from '@anthropic-ai/sdk'
import type { AgentInput } from './types'
import type { ReportJSON } from '@/types/report'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Bạn là chuyên gia phân tích dòng tiền. Hãy:
1. Phân tích dòng tiền từ hoạt động kinh doanh
2. Phân tích dòng tiền từ đầu tư
3. Phân tích dòng tiền từ tài chính
4. Tính dòng tiền thuần
5. Đánh giá khả năng thanh khoản. Nhận xét tiếng Việt.

Nếu không có báo cáo dòng tiền riêng, hãy ước tính từ dữ liệu có sẵn và ghi chú trong analysis.

Trả về JSON theo schema sau:
{
  "cashflow": {
    "operatingCashflow": <số, có thể âm>,
    "investingCashflow": <số, có thể âm>,
    "financingCashflow": <số, có thể âm>,
    "netCashflow": <số, có thể âm>,
    "analysis": "..."
  }
}

Chỉ trả về JSON, không có markdown code block, không giải thích.`

export async function runAgent(
  input: AgentInput,
  onProgress?: (msg: string) => void
): Promise<Partial<ReportJSON>> {
  onProgress?.('Agent 5: Đang phân tích dòng tiền...')

  const context = JSON.stringify({
    metadata: input.reportJSON.metadata,
    parsed: input.reportJSON.parsed,
    revenue: input.reportJSON.revenue,
    costs: input.reportJSON.costs,
    profit: input.reportJSON.profit,
  }, null, 2)

  const userMessage = `Phân tích dòng tiền từ báo cáo tài chính sau:

Context đã phân tích:
${context}

Nội dung gốc:
${input.rawText.slice(0, 50000)}

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
    onProgress?.('Agent 5: Đã nhận phản hồi, đang parse JSON...')
    return parseAgentResponse(responseText)
  } catch (err) {
    if (responseText) {
      try { return parseAgentResponse(responseText) } catch { /* fall through */ }
    }
    throw err
  }
}

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

  if (!parsed.cashflow) return {}
  const cf = parsed.cashflow as Record<string, unknown>

  return {
    cashflow: {
      operatingCashflow: Number(cf.operatingCashflow ?? 0),
      investingCashflow: Number(cf.investingCashflow ?? 0),
      financingCashflow: Number(cf.financingCashflow ?? 0),
      netCashflow: Number(cf.netCashflow ?? 0),
      analysis: String(cf.analysis ?? ''),
    },
  }
}
