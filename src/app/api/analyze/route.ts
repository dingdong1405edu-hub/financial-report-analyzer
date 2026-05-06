import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { parseFile } from '@/lib/file-parser'
import { createSession, updateSessionReport } from '@/lib/session-store'
import { runAgentPipeline } from '@/agents/index'

const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB ?? '10') * 1024 * 1024)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy file' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File quá lớn. Tối đa ${process.env.MAX_FILE_SIZE_MB ?? 10}MB` },
        { status: 413 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const parsed = await parseFile(buffer, file.name, file.type)

    const sessionId = uuidv4()
    const session = createSession(sessionId, parsed.text)

    updateSessionReport(sessionId, {
      metadata: {
        companyName: 'Đang phân tích...',
        reportPeriod: '',
        currency: 'VND',
        generatedAt: new Date().toISOString(),
        fileName: file.name,
      },
    })

    // Run pipeline in background (no await)
    runAgentPipeline(sessionId).catch((err) => {
      console.error(`Background pipeline error for ${sessionId}:`, err)
    })

    return NextResponse.json({ sessionId, fileName: file.name, format: parsed.format })
  } catch (err) {
    console.error('Analyze route error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi xử lý file' },
      { status: 500 }
    )
  }
}
