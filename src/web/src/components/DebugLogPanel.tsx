import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

const DEBUG_EVENT_NAME = 'tss:debug-log'
const MAX_LOGS = 250

interface DebugLogPayload {
  timestamp: string
  source: string
  level: 'info' | 'warn' | 'error'
  message: string
  details?: Record<string, unknown>
}

export function DebugLogPanel() {
  const [logs, setLogs] = useState<DebugLogPayload[]>([])

  const debugEnabled = useMemo(() => {
    const search = new URLSearchParams(window.location.search)
    if (!search.has('debug')) return false
    const value = search.get('debug')
    if (value === null || value === '') return true
    const normalized = value.toLowerCase()
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
  }, [])

  useEffect(() => {
    if (!debugEnabled) return

    const appendLog = (entry: DebugLogPayload) => {
      setLogs((previous) => {
        const next = [...previous, entry]
        if (next.length > MAX_LOGS) {
          return next.slice(next.length - MAX_LOGS)
        }
        return next
      })
    }

    appendLog({
      timestamp: new Date().toISOString(),
      source: 'ui',
      level: 'info',
      message: 'Debug mode enabled via query string',
      details: {
        search: window.location.search,
      },
    })

    const handleDebugLog = (event: Event) => {
      const customEvent = event as CustomEvent<DebugLogPayload>
      appendLog(customEvent.detail)
    }

    window.addEventListener(DEBUG_EVENT_NAME, handleDebugLog as EventListener)
    return () => {
      window.removeEventListener(DEBUG_EVENT_NAME, handleDebugLog as EventListener)
    }
  }, [debugEnabled])

  if (!debugEnabled) {
    return null
  }

  return (
    <Card className="fixed bottom-4 right-4 z-[60] w-[min(96vw,44rem)] h-64 p-3 bg-card/95 backdrop-blur">
      <div className="flex items-center justify-between gap-2 pb-2">
        <div className="text-sm font-semibold">Debug Logs</div>
        <Button variant="outline" size="sm" onClick={() => setLogs([])}>Clear</Button>
      </div>
      <ScrollArea className="h-[calc(100%-2.5rem)] rounded border p-2">
        <div className="space-y-2 text-xs">
          {logs.length === 0 && <div className="text-muted-foreground">No logs yet</div>}
          {logs.map((log, index) => (
            <div key={`${log.timestamp}-${index}`} className="rounded border p-2">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-semibold uppercase">{log.level}</span>
                <span className="text-muted-foreground">{log.timestamp}</span>
                <span className="text-muted-foreground">[{log.source}]</span>
              </div>
              <div className="mt-1">{log.message}</div>
              {log.details && (
                <pre className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap break-words text-muted-foreground">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  )
}
