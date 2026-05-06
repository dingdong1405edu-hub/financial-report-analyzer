import { NextResponse } from 'next/server'
import { Font } from '@react-pdf/renderer'
import { NOTO_SANS_REGULAR_DATA } from '@/lib/pdf-font-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    Font.register({
      family: 'DebugFont',
      fonts: [{ src: NOTO_SANS_REGULAR_DATA, fontWeight: 400 }],
    })
    const families = Font.getRegisteredFontFamilies()
    return NextResponse.json({
      ok: true,
      families,
      dataUriLength: NOTO_SANS_REGULAR_DATA.length,
      nodeVersion: process.version,
      commit: 'fdbd5af',
    })
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      nodeVersion: process.version,
      commit: 'fdbd5af',
    })
  }
}
