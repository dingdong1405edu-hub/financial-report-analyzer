import Anthropic from '@anthropic-ai/sdk'
import type { AgentInput } from './types'
import type { ReportJSON } from '@/types/report'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Bạn là chuyên gia phân tích bảng cân đối kế toán. Hãy:
1. Tổng hợp tài sản (ngắn hạn + dài hạn)
2. Tổng hợp nợ phải trả
3. Vốn chủ sở hữu
4. Tính hệ số nợ/vốn
5. Nhận xét cơ cấu tài chính bằng tiếng Việt

Trả về JSON theo schema sau:
{
  "balance": {
    "totalAssets": <số>,
    "totalLiabilities": <số>,
    "equity": <số>,
    "debtToEquity": <số, tỷ lệ>,
    "analysis": "..."
  }
}

Chỉ trả về JSON, không có markdown code block, không giải thích.`

export async function runAgent(
  input: AgentInput,
  onProgress?: (msg: string) => void
): Promise<Partial<ReportJSON>> {
  onProgress?.('Agent 6: Đang phân tích bảng cân đối kế toán...')

  const context = JSON.stringify({
    metadata: input.reportJSON.metadata,
    parsed: input.reportJSON.parsed,
    revenue: input.reportJSON.revenue,
    costs: input.reportJSON.costs,
    profit: input.reportJSON.profit,
    cashflow: input.reportJSON.cashflow,
  }, null, 2)

  const userMessage = `Phân tích bảng cân đối kế toán từ báo cáo tài chính sau:

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
    onProgress?.('Agent 6: Đã nhận phản hồi, đang parse JSON...')
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

  if (!parsed.balance) return {}
  const b = parsed.balance as Record<string, unknown>

  return {
    balance: {
      totalAssets: Number(b.totalAssets ?? 0),
      totalLiabilities: Number(b.totalLiabilities ?? 0),
      equity: Number(b.equity ?? 0),
      debtToEquity: Number(b.debtToEquity ?? 0),
      analysis: String(b.analysis ?? ''),
    },
  }
}
