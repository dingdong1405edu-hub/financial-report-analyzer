import Anthropic from '@anthropic-ai/sdk'
import type { AgentInput } from './types'
import type { ReportJSON } from '@/types/report'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Bạn là chuyên gia phân tích xu hướng tài chính. Hãy:
1. Xác định xu hướng doanh thu (tăng/giảm/ổn định)
2. Xác định xu hướng lợi nhuận
3. Đưa ra dự báo ngắn hạn (1-2 kỳ tới)
4. Tạo chartData: mảng điểm dữ liệu cho biểu đồ (dựa trên dữ liệu có sẵn, hoặc ước tính nếu chỉ có 1 kỳ)
5. Phân tích xu hướng bằng tiếng Việt

Trả về JSON theo schema sau:
{
  "trends": {
    "revenueGrowthTrend": "Tăng trưởng/Giảm/Ổn định",
    "profitTrend": "Tăng trưởng/Giảm/Ổn định",
    "forecast": "Dự báo ngắn gọn 1-2 câu",
    "chartData": [
      {"period": "Q1 2023", "value": <số>, "label": "Doanh thu"},
      {"period": "Q2 2023", "value": <số>, "label": "Doanh thu"}
    ],
    "analysis": "..."
  }
}

Chỉ trả về JSON, không có markdown code block, không giải thích.`

export async function runAgent(
  input: AgentInput,
  onProgress?: (msg: string) => void
): Promise<Partial<ReportJSON>> {
  onProgress?.('Agent 8: Đang phân tích xu hướng...')

  const context = JSON.stringify({
    metadata: input.reportJSON.metadata,
    revenue: input.reportJSON.revenue,
    costs: input.reportJSON.costs,
    profit: input.reportJSON.profit,
    cashflow: input.reportJSON.cashflow,
    balance: input.reportJSON.balance,
    ratios: input.reportJSON.ratios,
  }, null, 2)

  const userMessage = `Phân tích xu hướng từ dữ liệu tài chính sau:

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
    onProgress?.('Agent 8: Đã nhận phản hồi, đang parse JSON...')
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

  if (!parsed.trends) return {}
  const t = parsed.trends as Record<string, unknown>

  return {
    trends: {
      revenueGrowthTrend: String(t.revenueGrowthTrend ?? 'Không xác định'),
      profitTrend: String(t.profitTrend ?? 'Không xác định'),
      forecast: String(t.forecast ?? ''),
      chartData: Array.isArray(t.chartData)
        ? t.chartData.map((item: Record<string, unknown>) => ({
            period: String(item.period ?? ''),
            value: Number(item.value ?? 0),
            label: String(item.label ?? ''),
          }))
        : [],
      analysis: String(t.analysis ?? ''),
    },
  }
}
