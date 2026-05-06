/**
 * Standalone test server — chạy bằng: npx tsx test-server.ts
 * Mở trình duyệt tại: http://localhost:3001
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import type { DocumentProps } from '@react-pdf/renderer'

import { parseFile } from './src/lib/file-parser'
import {
  createSession,
  getSession,
  updateSessionReport,
  type AnalysisSession,
} from './src/lib/session-store'
import { runAgentPipeline } from './src/agents/index'
import ReportDocument from './src/components/pdf/ReportDocument'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = 3001

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function readBody(req: IncomingMessage, maxBytes = 30 * 1024 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > maxBytes) { reject(new Error('Request too large')); return }
      body += chunk.toString()
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function json(res: ServerResponse, status: number, data: unknown) {
  const body = JSON.stringify(data)
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) })
  res.end(body)
}

// ──────────────────────────────────────────────────────────────────────────────
// Server
// ──────────────────────────────────────────────────────────────────────────────

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const baseUrl = `http://localhost:${PORT}`
  const url = new URL(req.url ?? '/', baseUrl)

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  try {
    // ── GET / → serve test.html ─────────────────────────────────────────────
    if (url.pathname === '/' && req.method === 'GET') {
      const html = readFileSync(join(__dirname, 'test.html'), 'utf-8')
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(html)
      return
    }

    // ── POST /analyze → nhận base64 file, khởi động pipeline ───────────────
    if (url.pathname === '/analyze' && req.method === 'POST') {
      const raw = await readBody(req)
      const { fileName, mimeType, data } = JSON.parse(raw) as {
        fileName: string
        mimeType: string
        data: string
      }

      if (!data) { json(res, 400, { error: 'Thiếu data' }); return }

      const buffer = Buffer.from(data, 'base64')
      const maxBytes = parseInt(process.env.MAX_FILE_SIZE_MB ?? '10') * 1024 * 1024
      if (buffer.length > maxBytes) {
        json(res, 413, { error: `File quá lớn. Tối đa ${process.env.MAX_FILE_SIZE_MB ?? 10}MB` })
        return
      }

      const parsed = await parseFile(buffer, fileName, mimeType)
      const sessionId = uuid()

      createSession(sessionId, parsed.text)
      updateSessionReport(sessionId, {
        metadata: {
          companyName: 'Đang phân tích...',
          reportPeriod: '',
          currency: 'VND',
          generatedAt: new Date().toISOString(),
          fileName,
        },
      })

      runAgentPipeline(sessionId).catch((err) =>
        console.error(`[${sessionId}] Pipeline error:`, err)
      )

      json(res, 200, { sessionId, fileName, format: parsed.format })
      return
    }

    // ── GET /stream?sessionId=xxx → SSE ─────────────────────────────────────
    if (url.pathname === '/stream' && req.method === 'GET') {
      const sessionId = url.searchParams.get('sessionId')
      if (!sessionId) { res.writeHead(400); res.end('sessionId required'); return }

      const session = getSession(sessionId)
      if (!session) { res.writeHead(404); res.end('Session not found'); return }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      })

      const send = (data: Record<string, unknown>) =>
        res.write(`data: ${JSON.stringify(data)}\n\n`)

      const sess: AnalysisSession = session

      if (sess.status === 'completed') {
        send({ type: 'complete', reportJSON: sess.reportJSON, agentStatuses: sess.agentStatuses })
        res.end()
        return
      }
      if (sess.status === 'error') {
        send({ type: 'error', message: 'Pipeline failed' })
        res.end()
        return
      }

      send({ type: 'init', agentStatuses: sess.agentStatuses, reportJSON: sess.reportJSON })

      const onAgent = (d: { agentId: number; agentName: string; reportJSON: unknown }) =>
        send({ type: 'agent_complete', ...d, agentStatuses: sess.agentStatuses })

      const onComplete = (d: { reportJSON: unknown }) => {
        send({ type: 'complete', ...d, agentStatuses: sess.agentStatuses })
        cleanup(); res.end()
      }

      const onError = (d: { message: string }) => {
        send({ type: 'error', message: d.message })
        cleanup(); res.end()
      }

      function cleanup() {
        sess.emitter.off('agent_complete', onAgent)
        sess.emitter.off('complete', onComplete)
        sess.emitter.off('error', onError)
      }

      sess.emitter.on('agent_complete', onAgent)
      sess.emitter.on('complete', onComplete)
      sess.emitter.on('error', onError)
      req.on('close', cleanup)
      return
    }

    // ── GET /export-pdf?sessionId=xxx → PDF download ────────────────────────
    if (url.pathname === '/export-pdf' && req.method === 'GET') {
      const sessionId = url.searchParams.get('sessionId')
      if (!sessionId) { json(res, 400, { error: 'sessionId required' }); return }

      const session = getSession(sessionId)
      if (!session) { json(res, 404, { error: 'Session not found' }); return }

      const element = React.createElement(
        ReportDocument,
        { reportJSON: session.reportJSON }
      ) as React.ReactElement<DocumentProps>

      const pdfBuffer = await renderToBuffer(element)

      const company = session.reportJSON.metadata?.companyName ?? 'report'
      const safeName = company.replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '_') || 'report'
      const fileName = `bctc-${safeName}.pdf`

      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': pdfBuffer.length,
      })
      res.end(pdfBuffer)
      return
    }

    // ── GET /status?sessionId=xxx → JSON polling fallback ───────────────────
    if (url.pathname === '/status' && req.method === 'GET') {
      const sessionId = url.searchParams.get('sessionId')
      if (!sessionId) { json(res, 400, { error: 'sessionId required' }); return }

      const session = getSession(sessionId)
      if (!session) { json(res, 404, { error: 'Session not found' }); return }

      json(res, 200, {
        status: session.status,
        agentStatuses: session.agentStatuses,
        reportJSON: session.reportJSON,
      })
      return
    }

    res.writeHead(404); res.end('Not found')
  } catch (err) {
    console.error('Server error:', err)
    if (!res.headersSent) json(res, 500, { error: err instanceof Error ? err.message : 'Server error' })
  }
})

server.listen(PORT, () => {
  console.log(`\n✅  Test server running`)
  console.log(`👉  Open http://localhost:${PORT} in your browser\n`)
})
