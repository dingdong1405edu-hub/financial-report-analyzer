import { EventEmitter } from 'events'
import type { ReportJSON } from '@/types/report'
import type { AgentStatus } from '@/agents/types'
import { makeInitialAgentStatuses } from '@/agents/types'

export interface AnalysisSession {
  sessionId: string
  status: 'running' | 'completed' | 'error'
  reportJSON: Partial<ReportJSON>
  agentStatuses: AgentStatus[]
  rawText: string
  createdAt: Date
  emitter: EventEmitter
}

const sessions = new Map<string, AnalysisSession>()

export function createSession(sessionId: string, rawText: string): AnalysisSession {
  const emitter = new EventEmitter()
  emitter.setMaxListeners(20)

  const session: AnalysisSession = {
    sessionId,
    status: 'running',
    reportJSON: {},
    agentStatuses: makeInitialAgentStatuses(),
    rawText,
    createdAt: new Date(),
    emitter,
  }

  sessions.set(sessionId, session)
  return session
}

export function getSession(sessionId: string): AnalysisSession | undefined {
  return sessions.get(sessionId)
}

export function updateSessionAgent(
  sessionId: string,
  agentId: number,
  status: AgentStatus['status'],
  error?: string
): void {
  const session = sessions.get(sessionId)
  if (!session) return

  const agent = session.agentStatuses.find((a) => a.id === agentId)
  if (!agent) return

  agent.status = status
  if (status === 'running') agent.startedAt = new Date()
  if (status === 'completed' || status === 'error') agent.completedAt = new Date()
  if (error) agent.error = error
}

export function updateSessionReport(
  sessionId: string,
  partial: Partial<ReportJSON>
): void {
  const session = sessions.get(sessionId)
  if (!session) return

  session.reportJSON = { ...session.reportJSON, ...partial }
}

export function completeSession(sessionId: string): void {
  const session = sessions.get(sessionId)
  if (!session) return
  session.status = 'completed'
}

export function failSession(sessionId: string): void {
  const session = sessions.get(sessionId)
  if (!session) return
  session.status = 'error'
}

export function emitAgentComplete(
  sessionId: string,
  agentId: number,
  agentName: string
): void {
  const session = sessions.get(sessionId)
  if (!session) return
  session.emitter.emit('agent_complete', { agentId, agentName, reportJSON: session.reportJSON })
}

export function emitPipelineComplete(sessionId: string): void {
  const session = sessions.get(sessionId)
  if (!session) return
  session.emitter.emit('complete', { reportJSON: session.reportJSON })
}

export function emitPipelineError(sessionId: string, message: string): void {
  const session = sessions.get(sessionId)
  if (!session) return
  session.emitter.emit('error', { message })
}

// Clean up sessions older than 2 hours
setInterval(() => {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000
  for (const [id, session] of Array.from(sessions.entries())) {
    if (session.createdAt.getTime() < twoHoursAgo) {
      sessions.delete(id)
    }
  }
}, 30 * 60 * 1000)
