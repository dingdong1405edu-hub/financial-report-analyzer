import type { ReportJSON } from '@/types/report'

export type AgentStatusState = 'pending' | 'running' | 'completed' | 'error'

export interface AgentStatus {
  id: number
  name: string
  status: AgentStatusState
  startedAt?: Date
  completedAt?: Date
  error?: string
}

export interface AgentInput {
  rawText: string
  reportJSON: Partial<ReportJSON>
  sessionId: string
}

export const AGENT_NAMES: Record<number, string> = {
  1: 'Document Parser',
  2: 'Revenue Analyzer',
  3: 'Cost Analyzer',
  4: 'Profit Analyzer',
  5: 'Cashflow Analyzer',
  6: 'Balance Sheet Analyzer',
  7: 'Financial Ratio Calculator',
  8: 'Trend Analyzer',
  9: 'Risk Assessor',
  10: 'Synthesizer',
}

export function makeInitialAgentStatuses(): AgentStatus[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: AGENT_NAMES[i + 1],
    status: 'pending' as AgentStatusState,
  }))
}
