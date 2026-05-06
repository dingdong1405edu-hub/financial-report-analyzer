import Anthropic from '@anthropic-ai/sdk'
import type { AgentInput } from './types'
import type { ReportJSON } from '@/types/report'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Bạn là chuyên gia phân tích tài liệu tài chính. Nhiệm vụ của bạn là:
1. Đọc và hiểu cấu trúc của văn bản tài chính được cung cấp
2. Xác định: tên công ty, kỳ báo cáo, đơn vị tiền tệ
3. Liệt kê các trường dữ liệu chính tìm thấy
4. Chuẩn hóa số liệu (loại bỏ ký tự thừa, đổi về số)
5. Ghi nhận các cảnh báo nếu dữ liệu thiếu hoặc không rõ ràng

Trả về JSON theo đúng schema sau (không có markdown code block, không giải thích):
{
  "metadata": {
    "companyName": "Tên công ty",
    "reportPeriod": "Kỳ báo cáo (ví dụ: Q4 2023, Năm 2023)",
    "currency": "VND hoặc USD...",
    "generatedAt": "ISO date string",
    "fileName": "tên file"
  },
  "parsed": {
    "rawData": "Tóm tắt nội dung chính của tài liệu (tối đa 500 chữ)",
    "detectedFormat": "Loại báo cáo: BCTC, KQKD, BCTT...",
    "keyFields": ["Danh sách các trường dữ liệu tìm thấy"],
    "warnings": ["Các cảnh báo về dữ liệu nếu có"]
  }
}

Chỉ trả về JSON, không có markdown code block, không giải thích.`

export async function runAgent(
  input: AgentInput,
  onProgress?: (msg: string) => void
): Promise<Partial<ReportJSON>> {
  onProgress?.('Agent 1: Đang phân tích tài liệu...')

  const userMessage = `Phân tích tài liệu tài chính sau và trả về JSON:

Tên file: ${input.reportJSON.metadata?.fileName ?? 'unknown'}
Nội dung:
${input.rawText}

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
    onProgress?.('Agent 1: Đã nhận phản hồi, đang parse JSON...')

    return parseAgentResponse(responseText)
  } catch (err) {
    if (responseText) {
      try {
        return parseAgentResponse(responseText)
      } catch {
        // fall through
      }
    }
    throw err
  }
}

function parseAgentResponse(text: string): Partial<ReportJSON> {
  let jsonText = text.trim()

  // Strip markdown code blocks if present
  jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    // Retry: find first { to last }
    const start = jsonText.indexOf('{')
    const end = jsonText.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('Không tìm thấy JSON hợp lệ trong response')
    parsed = JSON.parse(jsonText.slice(start, end + 1))
  }

  const result: Partial<ReportJSON> = {}

  if (parsed.metadata && typeof parsed.metadata === 'object') {
    const m = parsed.metadata as Record<string, string>
    result.metadata = {
      companyName: m.companyName ?? 'Không xác định',
      reportPeriod: m.reportPeriod ?? 'Không xác định',
      currency: m.currency ?? 'VND',
      generatedAt: m.generatedAt ?? new Date().toISOString(),
      fileName: m.fileName ?? '',
    }
  }

  if (parsed.parsed && typeof parsed.parsed === 'object') {
    const p = parsed.parsed as Record<string, unknown>
    result.parsed = {
      rawData: String(p.rawData ?? ''),
      detectedFormat: String(p.detectedFormat ?? ''),
      keyFields: Array.isArray(p.keyFields) ? p.keyFields.map(String) : [],
      warnings: Array.isArray(p.warnings) ? p.warnings.map(String) : [],
    }
  }

  return result
}
