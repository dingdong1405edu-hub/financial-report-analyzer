import Anthropic from '@anthropic-ai/sdk'
import type { AgentInput } from './types'
import type { ReportJSON } from '@/types/report'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Bạn là chuyên gia tính toán chỉ số tài chính. Dựa trên tất cả dữ liệu đã phân tích, hãy tính:
1. Current Ratio = Tài sản ngắn hạn / Nợ ngắn hạn
2. Quick Ratio = (Tiền + Các khoản tương đương) / Nợ ngắn hạn
3. ROE = Lợi nhuận ròng / Vốn chủ sở hữu
4. ROA = Lợi nhuận ròng / Tổng tài sản
5. Debt Ratio = Tổng nợ / Tổng tài sản

Nếu không đủ dữ liệu để tính 1 chỉ số, đặt null.
Viết analysis giải thích ý nghĩa các chỉ số bằng tiếng Việt.

Trả về JSON theo schema sau:
{
  "ratios": {
    "currentRatio": <số hoặc null>,
    "quickRatio": <số hoặc null>,
    "roe": <số phần trăm hoặc null>,
    "roa": <số phần trăm hoặc null>,
    "debtRatio": <số phần trăm hoặc null>,
    "peRatio": <số hoặc null>,
    "analysis": "..."
  }
}

Chỉ trả về JSON, không có markdown code block, không giải thích.`

export async function runAgent(
  input: AgentInput,
  onProgress?: (msg: string) => void
): Promise<Partial<ReportJSON>> {
  onProgress?.('Agent 7: Đang tính các chỉ số tài chính...')

  const context = JSON.stringify({
    metadata: input.reportJSON.metadata,
    revenue: input.reportJSON.revenue,
    costs: input.reportJSON.costs,
    profit: input.reportJSON.profit,
    cashflow: input.reportJSON.cashflow,
    balance: input.reportJSON.balance,
  }, null, 2)

  const userMessage = `Tính các chỉ số tài chính từ dữ liệu sau:

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
    onProgress?.('Agent 7: Đã nhận phản hồi, đang parse JSON...')
    return parseAgentResponse(responseText)
  } catch (err) {
    if (responseText) {
      try { return parseAgentResponse(responseText) } catch { /* fall through */ }
    }
    throw err
  }
}

function toNullableNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const n = Number(val)
  return isNaN(n) ? null : n
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

  if (!parsed.ratios) return {}
  const r = parsed.ratios as Record<string, unknown>

  return {
    ratios: {
      currentRatio: toNullableNumber(r.currentRatio),
      quickRatio: toNullableNumber(r.quickRatio),
      roe: toNullableNumber(r.roe),
      roa: toNullableNumber(r.roa),
      debtRatio: toNullableNumber(r.debtRatio),
      peRatio: toNullableNumber(r.peRatio),
      analysis: String(r.analysis ?? ''),
    },
  }
}
