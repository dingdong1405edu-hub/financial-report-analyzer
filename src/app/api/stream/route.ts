import { NextRequest } from 'next/server'
import { getSession, type AnalysisSession } from '@/lib/session-store'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId')

  if (!sessionId) {
    return new Response('sessionId is required', { status: 400 })
  }

  const session = getSession(sessionId)
  if (!session) {
    return new Response('Session not found', { status: 404 })
  }

  const encoder = new TextEncoder()

  function sendEvent(data: Record<string, unknown>): Uint8Array {
    return encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
  }

  // Capture session reference to satisfy TypeScript narrowing inside callbacks
  const sess: AnalysisSession = session

  const stream = new ReadableStream({
    start(controller) {
      if (sess.status === 'completed') {
        controller.enqueue(
          sendEvent({
            type: 'complete',
            reportJSON: sess.reportJSON,
            agentStatuses: sess.agentStatuses,
          })
        )
        controller.close()
        return
      }

      if (sess.status === 'error') {
        controller.enqueue(sendEvent({ type: 'error', message: 'Pipeline failed' }))
        controller.close()
        return
      }

      controller.enqueue(
        sendEvent({
          type: 'init',
          agentStatuses: sess.agentStatuses,
          reportJSON: sess.reportJSON,
        })
      )

      function onAgentComplete(data: { agentId: number; agentName: string; reportJSON: unknown }) {
        controller.enqueue(
          sendEvent({
            type: 'agent_complete',
            agentId: data.agentId,
            agentName: data.agentName,
            reportJSON: data.reportJSON,
            agentStatuses: sess.agentStatuses,
          })
        )
      }

      function onComplete(data: { reportJSON: unknown }) {
        controller.enqueue(
          sendEvent({
            type: 'complete',
            reportJSON: data.reportJSON,
            agentStatuses: sess.agentStatuses,
          })
        )
        cleanup()
        controller.close()
      }

      function onError(data: { message: string }) {
        controller.enqueue(sendEvent({ type: 'error', message: data.message }))
        cleanup()
        controller.close()
      }

      function cleanup() {
        sess.emitter.off('agent_complete', onAgentComplete)
        sess.emitter.off('complete', onComplete)
        sess.emitter.off('error', onError)
      }

      sess.emitter.on('agent_complete', onAgentComplete)
      sess.emitter.on('complete', onComplete)
      sess.emitter.on('error', onError)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
