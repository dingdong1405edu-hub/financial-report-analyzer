export interface ParsedFile {
  text: string
  format: 'pdf' | 'excel' | 'csv' | 'unknown'
  fileName: string
  sizeBytes: number
}

const MAX_TEXT_LENGTH = 100_000

export async function parseFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ParsedFile> {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  const sizeBytes = buffer.length

  let text = ''
  let format: ParsedFile['format'] = 'unknown'

  if (ext === 'pdf' || mimeType === 'application/pdf') {
    text = await parsePdf(buffer)
    format = 'pdf'
  } else if (
    ext === 'xlsx' ||
    ext === 'xls' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel'
  ) {
    text = await parseExcel(buffer)
    format = 'excel'
  } else if (ext === 'csv' || mimeType === 'text/csv') {
    text = await parseCsv(buffer)
    format = 'csv'
  } else {
    text = buffer.toString('utf-8')
    format = 'unknown'
  }

  if (text.length > MAX_TEXT_LENGTH) {
    text = text.slice(0, MAX_TEXT_LENGTH) + '\n\n[Nội dung bị cắt bớt do vượt quá 100,000 ký tự]'
  }

  return { text, format, fileName, sizeBytes }
}

async function parsePdf(buffer: Buffer): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default
  const data = await pdfParse(buffer)
  return data.text
}

async function parseExcel(buffer: Buffer): Promise<string> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'buffer' })

  const lines: string[] = []
  for (const sheetName of workbook.SheetNames) {
    lines.push(`=== Sheet: ${sheetName} ===`)
    const sheet = workbook.Sheets[sheetName]
    const csv = XLSX.utils.sheet_to_csv(sheet)
    lines.push(csv)
    lines.push('')
  }

  return lines.join('\n')
}

async function parseCsv(buffer: Buffer): Promise<string> {
  const Papa = (await import('papaparse')).default
  const text = buffer.toString('utf-8')
  const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true })

  const rows = result.data
  if (rows.length === 0) return text

  const headers = Object.keys(rows[0])
  const lines = [headers.join('\t')]
  for (const row of rows) {
    lines.push(headers.map((h) => row[h] ?? '').join('\t'))
  }

  return lines.join('\n')
}
