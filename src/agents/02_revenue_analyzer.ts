import Anthropic from '@anthropic-ai/sdk'
import type { AgentInput } from './types'
import type { ReportJSON } from '@/types/report'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Bạn là chuyên gia phân tích doanh thu. Dựa trên dữ liệu tài chính, hãy:
1. Tính tổng doanh thu
2. Phân tích cơ cấu doanh thu theo từng nguồn
3. Tính tăng trưởng doanh thu (nếu có dữ liệu nhiều kỳ)
4. Xác định nguồn doanh thu chủ lực
5. Nhận xét ngắn gọn bằng tiếng Việt (analysis, 2-3 câu)

Trả về JSON theo schema sau:
{
  "revenue": {
    "totalRevenue": <số>,
    "revenueBreakdown": [{"name": "...", "amount": <số>, "percentage": <số>}],
    "revenueGrowth": <số hoặc null>,
    "topRevenueSource": "...",
    "analysis": "..."
  }
}

Chỉ trả về JSON, không có markdown code block, không giải thích.`

export async function runAgent(
  input: AgentInput,
  onProgress?: (msg: string) => void
): Promise<Partial<ReportJSON>> {
  onProgress?.('Agent 2: Đang phân tích doanh thu...')

  const context = JSON.stringify({
    metadata: input.reportJSON.metadata,
    parsed: input.reportJSON.parsed,
  }, null, 2)

  const userMessage = `Phân tích doanh thu từ báo cáo tài chính sau:

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
    onProgress?.('Agent 2: Đã nhận phản hồi, đang parse JSON...')
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

  if (!parsed.revenue) return {}
  const r = parsed.revenue as Record<string, unknown>

  return {
    revenue: {
      totalRevenue: Number(r.totalRevenue ?? 0),
      revenueBreakdown: Array.isArray(r.revenueBreakdown)
        ? r.revenueBreakdown.map((item: Record<string, unknown>) => ({
            name: String(item.name ?? ''),
            amount: Number(item.amount ?? 0),
            percentage: Number(item.percentage ?? 0),
          }))
        : [],
      revenueGrowth: r.revenueGrowth != null ? Number(r.revenueGrowth) : null,
      topRevenueSource: String(r.topRevenueSource ?? ''),
      analysis: String(r.analysis ?? ''),
    },
  }
}
