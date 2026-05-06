import {
  getSession,
  updateSessionAgent,
  updateSessionReport,
  completeSession,
  failSession,
  emitAgentComplete,
  emitPipelineComplete,
  emitPipelineError,
} from '@/lib/session-store'
import { runAgent as runAgent1 } from './01_document_parser'
import { runAgent as runAgent2 } from './02_revenue_analyzer'
import { runAgent as runAgent3 } from './03_cost_analyzer'
import { runAgent as runAgent4 } from './04_profit_analyzer'
import { runAgent as runAgent5 } from './05_cashflow_analyzer'
import { runAgent as runAgent6 } from './06_balance_analyzer'
import { runAgent as runAgent7 } from './07_ratio_calculator'
import { runAgent as runAgent8 } from './08_trend_analyzer'
import { runAgent as runAgent9 } from './09_risk_assessor'
import { runAgent as runAgent10 } from './10_synthesizer'
import type { AgentInput } from './types'

export async function runAgentPipeline(sessionId: string): Promise<void> {
  const session = getSession(sessionId)
  if (!session) {
    console.error(`Session ${sessionId} not found`)
    return
  }

  try {
    await runAgentStep(sessionId, 1, 'Document Parser', runAgent1)
    await runAgentStep(sessionId, 2, 'Revenue Analyzer', runAgent2)
    await runAgentStep(sessionId, 3, 'Cost Analyzer', runAgent3)
    await runAgentStep(sessionId, 4, 'Profit Analyzer', runAgent4)
    await runAgentStep(sessionId, 5, 'Cashflow Analyzer', runAgent5)
    await runAgentStep(sessionId, 6, 'Balance Sheet Analyzer', runAgent6)
    await runAgentStep(sessionId, 7, 'Financial Ratio Calculator', runAgent7)
    await runAgentStep(sessionId, 8, 'Trend Analyzer', runAgent8)
    await runAgentStep(sessionId, 9, 'Risk Assessor', runAgent9)
    await runAgentStep(sessionId, 10, 'Synthesizer', runAgent10)
  } catch (err) {
    console.error(`Pipeline error for session ${sessionId}:`, err)
    failSession(sessionId)
    emitPipelineError(sessionId, err instanceof Error ? err.message : 'Pipeline failed')
    return
  }

  completeSession(sessionId)
  emitPipelineComplete(sessionId)
}

async function runAgentStep(
  sessionId: string,
  agentId: number,
  agentName: string,
  fn: (input: AgentInput, onProgress?: (msg: string) => void) => Promise<import('@/types/report').ReportJSON | Partial<import('@/types/report').ReportJSON>>
): Promise<void> {
  const session = getSession(sessionId)
  if (!session) throw new Error(`Session ${sessionId} not found`)

  updateSessionAgent(sessionId, agentId, 'running')

  try {
    const input: AgentInput = {
      rawText: session.rawText,
      reportJSON: session.reportJSON,
      sessionId,
    }
    const result = await fn(input, (msg) => console.log(`[${sessionId}] ${msg}`))
    updateSessionReport(sessionId, result)
    updateSessionAgent(sessionId, agentId, 'completed')
    emitAgentComplete(sessionId, agentId, agentName)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    updateSessionAgent(sessionId, agentId, 'error', message)
    console.error(`Agent ${agentId} failed:`, err)
    // Continue pipeline — don't rethrow
  }
}
