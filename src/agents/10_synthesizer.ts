import Anthropic from '@anthropic-ai/sdk'
import type { AgentInput } from './types'
import type { ReportJSON } from '@/types/report'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Bạn là CFO cấp cao đang viết báo cáo tổng hợp. Dựa trên tất cả phân tích của 9 agent trước, hãy:
1. Viết executive summary súc tích 150-200 chữ tiếng Việt
2. Phân tích SWOT (điểm mạnh, yếu, cơ hội, thách thức) - mỗi mảng 3-5 điểm
3. Đánh giá tổng thể từ 1-10
4. Đưa ra 3-5 khuyến nghị hành động cụ thể, có độ ưu tiên
5. Viết kết luận 100-150 chữ

Đây là phần quan trọng nhất của báo cáo. Hãy viết chuyên nghiệp, cụ thể.

Trả về JSON theo schema sau:
{
  "synthesis": {
    "executiveSummary": "...",
    "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
    "weaknesses": ["Điểm yếu 1", "Điểm yếu 2"],
    "opportunities": ["Cơ hội 1", "Cơ hội 2"],
    "threats": ["Thách thức 1", "Thách thức 2"],
    "overallRating": <số từ 1-10>,
    "recommendations": [
      {
        "priority": "Urgent|High|Medium|Low",
        "action": "Hành động cụ thể",
        "rationale": "Lý do",
        "timeframe": "Thời gian thực hiện"
      }
    ],
    "conclusion": "..."
  }
}

Chỉ trả về JSON, không có markdown code block, không giải thích.`

export async function runAgent(
  input: AgentInput,
  onProgress?: (msg: string) => void
): Promise<Partial<ReportJSON>> {
  onProgress?.('Agent 10: Đang tổng hợp báo cáo...')

  const context = JSON.stringify(input.reportJSON, null, 2)

  const userMessage = `Tổng hợp toàn bộ phân tích tài chính sau và viết báo cáo cuối cùng:

Toàn bộ dữ liệu đã phân tích:
${context}

Chỉ trả về JSON thuần túy, không có markdown code block, không giải thích.`

  let responseText = ''

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    responseText = (message.content[0] as Anthropic.TextBlock).text
    onProgress?.('Agent 10: Đã nhận phản hồi, đang parse JSON...')
    return parseAgentResponse(responseText)
  } catch (err) {
    if (responseText) {
      try { return parseAgentResponse(responseText) } catch { /* fall through */ }
    }
    throw err
  }
}

const VALID_PRIORITIES = new Set(['Urgent', 'High', 'Medium', 'Low'])

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

  if (!parsed.synthesis) return {}
  const s = parsed.synthesis as Record<string, unknown>

  return {
    synthesis: {
      executiveSummary: String(s.executiveSummary ?? ''),
      strengths: Array.isArray(s.strengths) ? s.strengths.map(String) : [],
      weaknesses: Array.isArray(s.weaknesses) ? s.weaknesses.map(String) : [],
      opportunities: Array.isArray(s.opportunities) ? s.opportunities.map(String) : [],
      threats: Array.isArray(s.threats) ? s.threats.map(String) : [],
      overallRating: Math.min(10, Math.max(1, Number(s.overallRating ?? 5))),
      recommendations: Array.isArray(s.recommendations)
        ? s.recommendations.map((item: Record<string, unknown>) => {
            const priority = String(item.priority ?? 'Medium')
            return {
              priority: (VALID_PRIORITIES.has(priority) ? priority : 'Medium') as ReportJSON['synthesis']['recommendations'][number]['priority'],
              action: String(item.action ?? ''),
              rationale: String(item.rationale ?? ''),
              timeframe: String(item.timeframe ?? ''),
            }
          })
        : [],
      conclusion: String(s.conclusion ?? ''),
    },
  }
}
