import { Font } from '@react-pdf/renderer'
import path from 'path'
import fs from 'fs'

let registered = false

export function registerFonts() {
  if (registered) return
  registered = true

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
    console.error('[pdf-fonts] Failed to register NotoSans:', err)
    registered = false
  }
}
