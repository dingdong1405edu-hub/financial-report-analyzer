'use client'

import { useState, useRef, useCallback } from 'react'
import clsx from 'clsx'

type AgentStatusState = 'pending' | 'running' | 'completed' | 'error'

interface AgentStatus {
  id: number
  name: string
  status: AgentStatusState
}

type AppState = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error'

const AGENT_NAMES = [
  'Document Parser',
  'Revenue Analyzer',
  'Cost Analyzer',
  'Profit Analyzer',
  'Cashflow Analyzer',
  'Balance Sheet Analyzer',
  'Financial Ratio Calculator',
  'Trend Analyzer',
  'Risk Assessor',
  'Synthesizer',
]

function StatusIcon({ status }: { status: AgentStatusState }) {
  if (status === 'completed') {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600 text-xs font-bold">
        ✓
      </span>
    )
  }
  if (status === 'running') {
    return (
      <span className="flex h-6 w-6 items-center justify-center">
        <span className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 text-xs font-bold">
        ✕
      </span>
    )
  }
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400 text-xs">
      {String('○')}
    </span>
  )
}

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>(
    AGENT_NAMES.map((name, i) => ({ id: i + 1, name, status: 'pending' }))
  )
  const [completedAgents, setCompletedAgents] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [downloadReady, setDownloadReady] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const handleFile = useCallback(async (file: File) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv']
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!allowed.includes(file.type) && !['pdf', 'xlsx', 'xls', 'csv'].includes(ext ?? '')) {
      setErrorMsg('Chỉ hỗ trợ file PDF, Excel (.xlsx/.xls), hoặc CSV')
      setAppState('error')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File quá lớn. Tối đa 10MB')
      setAppState('error')
      return
    }

    setFileName(file.name)
    setAppState('uploading')
    setErrorMsg('')
    setDownloadReady(false)
    setCompletedAgents(0)
    setAgentStatuses(AGENT_NAMES.map((name, i) => ({ id: i + 1, name, status: 'pending' })))

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Lỗi upload file')
        setAppState('error')
        return
      }

      setSessionId(data.sessionId)
      setAppState('analyzing')
      startStream(data.sessionId)
    } catch {
      setErrorMsg('Không thể kết nối đến server')
      setAppState('error')
    }
  }, [])

  function startStream(sid: string) {
    if (eventSourceRef.current) eventSourceRef.current.close()

    const es = new EventSource(`/api/stream?sessionId=${sid}`)
    eventSourceRef.current = es

    es.onmessage = (e) => {
      const data = JSON.parse(e.data)

      if (data.type === 'init' || data.type === 'agent_complete') {
        if (data.agentStatuses) {
          setAgentStatuses(data.agentStatuses)
          const done = (data.agentStatuses as AgentStatus[]).filter((a) => a.status === 'completed').length
          setCompletedAgents(done)
        }
      }

      if (data.type === 'complete') {
        if (data.agentStatuses) {
          setAgentStatuses(data.agentStatuses)
          const done = (data.agentStatuses as AgentStatus[]).filter((a) => a.status === 'completed').length
          setCompletedAgents(done)
        }
        setAppState('done')
        setDownloadReady(true)
        es.close()
      }

      if (data.type === 'error') {
        setErrorMsg(data.message ?? 'Pipeline thất bại')
        setAppState('error')
        es.close()
      }
    }

    es.onerror = () => {
      // SSE might close after completion, ignore if done
      if (appState !== 'done') {
        es.close()
      }
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleDownload() {
    window.open(`/api/export-pdf?sessionId=${sessionId}`, '_blank')
  }

  function handleReset() {
    if (eventSourceRef.current) eventSourceRef.current.close()
    setAppState('idle')
    setFileName('')
    setSessionId('')
    setErrorMsg('')
    setDownloadReady(false)
    setCompletedAgents(0)
    setAgentStatuses(AGENT_NAMES.map((name, i) => ({ id: i + 1, name, status: 'pending' })))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const isAnalyzing = appState === 'analyzing' || appState === 'uploading'

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-start py-12 px-4">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Phân Tích Báo Cáo Tài Chính AI
        </h1>
        <p className="text-blue-300 text-sm">
          Upload PDF / Excel / CSV — nhận báo cáo PDF chuyên sâu từ 10 AI agents
        </p>
      </div>

      <div className="w-full max-w-2xl space-y-6">
        {/* Upload Zone */}
        {appState === 'idle' || appState === 'error' ? (
          <div
            className={clsx(
              'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all',
              dragOver
                ? 'border-blue-400 bg-blue-900/30'
                : 'border-blue-700 bg-slate-800/40 hover:border-blue-500 hover:bg-slate-800/60'
            )}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.xlsx,.xls,.csv"
              className="hidden"
              onChange={handleInputChange}
            />
            <div className="text-5xl mb-4">📊</div>
            <p className="text-white font-medium text-lg mb-1">
              Kéo thả file vào đây hoặc click để chọn
            </p>
            <p className="text-blue-400 text-sm">PDF, Excel (.xlsx/.xls), CSV — tối đa 10MB</p>
            {appState === 'error' && (
              <p className="mt-4 text-red-400 text-sm bg-red-900/30 rounded-lg px-4 py-2">
                {errorMsg}
              </p>
            )}
          </div>
        ) : null}

        {/* Uploading indicator */}
        {appState === 'uploading' && (
          <div className="bg-slate-800/60 rounded-xl p-6 text-center border border-blue-700">
            <div className="h-8 w-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-white font-medium">Đang upload và parse file...</p>
            <p className="text-blue-400 text-sm mt-1">{fileName}</p>
          </div>
        )}

        {/* Analyzing: Agent Progress */}
        {(appState === 'analyzing' || appState === 'done') && (
          <div className="bg-slate-800/60 rounded-xl border border-blue-800 overflow-hidden">
            <div className="bg-blue-900/50 px-6 py-4 border-b border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">{fileName}</p>
                  <p className="text-blue-400 text-sm mt-0.5">
                    {appState === 'done' ? 'Phân tích hoàn thành' : 'Đang phân tích...'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-white">{completedAgents}</span>
                  <span className="text-blue-400 text-sm">/10 agents</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                  style={{ width: `${(completedAgents / 10) * 100}%` }}
                />
              </div>
            </div>

            <div className="divide-y divide-slate-700/50">
              {agentStatuses.map((agent) => (
                <div
                  key={agent.id}
                  className={clsx(
                    'flex items-center gap-3 px-6 py-3 transition-colors',
                    agent.status === 'running' && 'bg-blue-900/20',
                    agent.status === 'completed' && 'bg-green-900/10',
                    agent.status === 'error' && 'bg-red-900/10'
                  )}
                >
                  <StatusIcon status={agent.status} />
                  <span
                    className={clsx(
                      'text-sm flex-1',
                      agent.status === 'completed' && 'text-green-300',
                      agent.status === 'running' && 'text-blue-300 font-medium',
                      agent.status === 'error' && 'text-red-400',
                      agent.status === 'pending' && 'text-slate-400'
                    )}
                  >
                    Agent {agent.id} — {agent.name}
                  </span>
                  <span className={clsx(
                    'text-xs px-2 py-0.5 rounded-full',
                    agent.status === 'completed' && 'bg-green-900/40 text-green-400',
                    agent.status === 'running' && 'bg-blue-900/40 text-blue-300',
                    agent.status === 'error' && 'bg-red-900/40 text-red-400',
                    agent.status === 'pending' && 'bg-slate-700 text-slate-400'
                  )}>
                    {agent.status === 'completed' ? 'Hoàn thành' :
                     agent.status === 'running' ? 'Đang chạy' :
                     agent.status === 'error' ? 'Lỗi' : 'Chờ'}
                  </span>
                </div>
              ))}
            </div>

            {/* Download Button */}
            {downloadReady && (
              <div className="px-6 py-4 border-t border-blue-800 bg-green-900/20 flex gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <span>📥</span>
                  Tải Báo Cáo PDF
                </button>
                <button
                  onClick={handleReset}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-3 px-4 rounded-lg transition-colors text-sm"
                >
                  Phân tích mới
                </button>
              </div>
            )}

            {/* Download available during analysis */}
            {!downloadReady && appState === 'analyzing' && completedAgents > 0 && (
              <div className="px-6 py-3 border-t border-blue-800/50">
                <button
                  onClick={handleDownload}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  📄 Tải PDF một phần ({completedAgents}/10 agents)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error state */}
        {appState === 'error' && errorMsg && (
          <div className="bg-red-900/20 border border-red-700 rounded-xl p-4 flex items-start gap-3">
            <span className="text-red-400 text-lg">⚠</span>
            <div className="flex-1">
              <p className="text-red-300 font-medium">Đã xảy ra lỗi</p>
              <p className="text-red-400 text-sm mt-1">{errorMsg}</p>
            </div>
            <button onClick={handleReset} className="text-red-400 hover:text-red-300 text-sm underline">
              Thử lại
            </button>
          </div>
        )}

        {/* Instructions */}
        {appState === 'idle' && (
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { icon: '📤', title: 'Upload', desc: 'PDF, Excel hoặc CSV báo cáo tài chính' },
              { icon: '🤖', title: '10 AI Agents', desc: 'Phân tích song song từng khía cạnh' },
              { icon: '📋', title: 'Nhận PDF', desc: 'Báo cáo chuyên nghiệp, sẵn sàng in' },
            ].map((item) => (
              <div key={item.title} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700">
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="text-white text-sm font-medium">{item.title}</p>
                <p className="text-slate-400 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
