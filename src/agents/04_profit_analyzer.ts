import Anthropic from '@anthropic-ai/sdk'
import type { AgentInput } from './types'
import type { ReportJSON } from '@/types/report'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Bạn là chuyên gia phân tích lợi nhuận. Hãy tính và phân tích:
1. Lợi nhuận gộp, lợi nhuận hoạt động, lợi nhuận ròng
2. Biên lợi nhuận gộp và ròng (%)
3. So sánh với kỳ trước nếu có
4. Nhận xét ngắn gọn bằng tiếng Việt

Trả về JSON theo schema sau:
{
  "profit": {
    "grossProfit": <số>,
    "operatingProfit": <số>,
    "netProfit": <số>,
    "grossMargin": <số phần trăm, ví dụ 35.5>,
    "netMargin": <số phần trăm>,
    "analysis": "..."
  }
}

Chỉ trả về JSON, không có markdown code block, không giải thích.`

export async function runAgent(
  input: AgentInput,
  onProgress?: (msg: string) => void
): Promise<Partial<ReportJSON>> {
  onProgress?.('Agent 4: Đang phân tích lợi nhuận...')

  const context = JSON.stringify({
    metadata: input.reportJSON.metadata,
    parsed: input.reportJSON.parsed,
    revenue: input.reportJSON.revenue,
    costs: input.reportJSON.costs,
  }, null, 2)

  const userMessage = `Phân tích lợi nhuận từ báo cáo tài chính sau:

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
    onProgress?.('Agent 4: Đã nhận phản hồi, đang parse JSON...')
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

  if (!parsed.profit) return {}
  const p = parsed.profit as Record<string, unknown>

  return {
    profit: {
      grossProfit: Number(p.grossProfit ?? 0),
      operatingProfit: Number(p.operatingProfit ?? 0),
      netProfit: Number(p.netProfit ?? 0),
      grossMargin: Number(p.grossMargin ?? 0),
      netMargin: Number(p.netMargin ?? 0),
      analysis: String(p.analysis ?? ''),
    },
  }
}
