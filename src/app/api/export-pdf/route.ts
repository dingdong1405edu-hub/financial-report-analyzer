import { NextRequest, NextResponse } from 'next/server'
import { Font, renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import fs from 'fs'
import path from 'path'
import { getSession } from '@/lib/session-store'
import ReportDocument from '@/components/pdf/ReportDocument'

export const dynamic = 'force-dynamic'

let fontsRegistered = false

function ensureFonts() {
  if (fontsRegistered) return
  fontsRegistered = true
  try {
    const dir = path.join(process.cwd(), 'public', 'fonts')
    const regularB64 = fs.readFileSync(path.join(dir, 'NotoSans-Regular.ttf')).toString('base64')
    const boldB64 = fs.readFileSync(path.join(dir, 'NotoSans-Bold.ttf')).toString('base64')
    Font.register({
      family: 'NotoSans',
      fonts: [
        { src: `data:font/ttf;base64,${regularB64}`, fontWeight: 400 },
        { src: `data:font/ttf;base64,${boldB64}`, fontWeight: 700 },
      ],
    })
  } catch (err) {
    fontsRegistered = false
    console.error('[export-pdf] Failed to register fonts:', err)
  }
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
  }

  const session = getSession(sessionId)
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  try {
    ensureFonts()

    const element = createElement(
      ReportDocument,
      { reportJSON: session.reportJSON }
    ) as React.ReactElement<DocumentProps>

    const pdfBuffer = await renderToBuffer(element)

    const company = session.reportJSON.metadata?.companyName ?? 'bao-cao'
    const safeName = company.replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '_')
    const fileName = `phan-tich-tai-chinh-${safeName || 'report'}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi tạo PDF' },
      { status: 500 }
    )
  }
}
