import Anthropic from '@anthropic-ai/sdk'
import type { AgentInput } from './types'
import type { ReportJSON } from '@/types/report'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Bạn là chuyên gia phân tích chi phí. Hãy:
1. Tổng hợp tất cả các loại chi phí
2. Phân tích cơ cấu chi phí
3. Tính tỷ lệ chi phí/doanh thu
4. Xác định driver chi phí lớn nhất
5. Nhận xét ngắn gọn bằng tiếng Việt

Trả về JSON theo schema sau:
{
  "costs": {
    "totalCosts": <số>,
    "costBreakdown": [{"name": "...", "amount": <số>, "percentage": <số>}],
    "costRatio": <số từ 0-100, phần trăm>,
    "majorCostDriver": "...",
    "analysis": "..."
  }
}

Chỉ trả về JSON, không có markdown code block, không giải thích.`

export async function runAgent(
  input: AgentInput,
  onProgress?: (msg: string) => void
): Promise<Partial<ReportJSON>> {
  onProgress?.('Agent 3: Đang phân tích chi phí...')

  const context = JSON.stringify({
    metadata: input.reportJSON.metadata,
    parsed: input.reportJSON.parsed,
    revenue: input.reportJSON.revenue,
  }, null, 2)

  const userMessage = `Phân tích chi phí từ báo cáo tài chính sau:

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
    onProgress?.('Agent 3: Đã nhận phản hồi, đang parse JSON...')
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

  if (!parsed.costs) return {}
  const c = parsed.costs as Record<string, unknown>

  return {
    costs: {
      totalCosts: Number(c.totalCosts ?? 0),
      costBreakdown: Array.isArray(c.costBreakdown)
        ? c.costBreakdown.map((item: Record<string, unknown>) => ({
            name: String(item.name ?? ''),
            amount: Number(item.amount ?? 0),
            percentage: Number(item.percentage ?? 0),
          }))
        : [],
      costRatio: Number(c.costRatio ?? 0),
      majorCostDriver: String(c.majorCostDriver ?? ''),
      analysis: String(c.analysis ?? ''),
    },
  }
}
