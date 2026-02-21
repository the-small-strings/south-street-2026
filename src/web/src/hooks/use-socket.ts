import { useEffect, useRef, useCallback, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import type { GigState } from '@/lib/types'

const API_PORT = 33001
const RECONNECT_INTERVAL = 3000 // 3 seconds between reconnection attempts
const DEBUG_EVENT_NAME = 'tss:debug-log'

function resolveSocketUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL
  const fallbackUrl = `${window.location.protocol}//${window.location.hostname}:${API_PORT}`

  if (!configuredUrl) {
    return fallbackUrl
  }

  try {
    const parsedUrl = new URL(configuredUrl, window.location.origin)
    const localHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0'])
    const isConfiguredLocalhost = localHosts.has(parsedUrl.hostname)
    const isClientLocalhost = localHosts.has(window.location.hostname)

    if (isConfiguredLocalhost && !isClientLocalhost) {
      parsedUrl.hostname = window.location.hostname
    }

    return parsedUrl.origin
  } catch {
    return fallbackUrl
  }
}

const SOCKET_URL = resolveSocketUrl()

interface UseSocketOptions {
  onGameStateUpdate?: (info: GigState) => void
  onTestKeyPress?: (key: string) => void
}

interface DebugLogPayload {
  timestamp: string
  source: string
  level: 'info' | 'warn' | 'error'
  message: string
  details?: Record<string, unknown>
}

export function useSocket(optionsOrCallback?: UseSocketOptions | ((info: GigState) => void)) {
  const socketRef = useRef<Socket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  // Support both old callback style and new options style
  const options: UseSocketOptions = typeof optionsOrCallback === 'function' 
    ? { onGameStateUpdate: optionsOrCallback }
    : optionsOrCallback ?? {}

  // Use refs to store callbacks so socket listeners always call the latest version
  const callbackRefs = useRef<UseSocketOptions>({})
  callbackRefs.current = options

  const logDebug = useCallback((
    level: DebugLogPayload['level'],
    message: string,
    details?: Record<string, unknown>
  ) => {
    const payload: DebugLogPayload = {
      timestamp: new Date().toISOString(),
      source: 'socket',
      level,
      message,
      details,
    }
    window.dispatchEvent(new CustomEvent<DebugLogPayload>(DEBUG_EVENT_NAME, { detail: payload }))
  }, [])

  const stopReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearInterval(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return

    // Clean up existing socket if any
    if (socketRef.current) {
      socketRef.current.removeAllListeners()
      socketRef.current.disconnect()
    }

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: false, // We'll handle reconnection manually for more control
    })

    logDebug('info', 'Socket connection starting', {
      socketUrl: SOCKET_URL,
      transports: ['websocket', 'polling'],
    })

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current?.id)
      logDebug('info', 'Socket connected', {
        socketId: socketRef.current?.id,
        socketUrl: SOCKET_URL,
      })
      setIsConnected(true)
      stopReconnectTimer()
    })

    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      logDebug('warn', 'Socket disconnected', {
        reason,
        socketId: socketRef.current?.id,
      })
      setIsConnected(false)
      startReconnectTimer()
    })

    socketRef.current.on('connect_error', (error) => {
      console.log('Socket connection error:', error.message)
      logDebug('error', 'Socket connection error', {
        message: error.message,
        name: error.name,
        description: (error as Error & { description?: unknown }).description,
        context: (error as Error & { context?: unknown }).context,
        type: (error as Error & { type?: unknown }).type,
        transport: socketRef.current?.io?.engine?.transport?.name,
        socketUrl: SOCKET_URL,
      })
      setIsConnected(false)
    })

    // Use wrapper functions that call from refs to always get latest callback
    socketRef.current.on('gameStateUpdate', (info: GigState) => {
      callbackRefs.current.onGameStateUpdate?.(info)
    })

    socketRef.current.on('testKeyPress', (key: string) => {
      callbackRefs.current.onTestKeyPress?.(key)
    })

    return socketRef.current
  }, [logDebug, stopReconnectTimer])

  const startReconnectTimer = useCallback(() => {
    // Don't start a new timer if one is already running
    if (reconnectTimerRef.current) return

    console.log('Starting reconnection timer...')
    logDebug('info', 'Starting socket reconnection timer', {
      reconnectIntervalMs: RECONNECT_INTERVAL,
    })
    reconnectTimerRef.current = setInterval(() => {
      if (!socketRef.current?.connected) {
        console.log('Attempting to reconnect...')
        logDebug('info', 'Attempting socket reconnect', {
          socketUrl: SOCKET_URL,
        })
        connect()
      } else {
        stopReconnectTimer()
      }
    }, RECONNECT_INTERVAL)
  }, [connect, logDebug, stopReconnectTimer])

  const disconnect = useCallback(() => {
    stopReconnectTimer()
    if (socketRef.current) {
      logDebug('info', 'Socket disconnect requested by client', {
        socketId: socketRef.current.id,
      })
      socketRef.current.removeAllListeners()
      socketRef.current.disconnect()
      socketRef.current = null
    }
    setIsConnected(false)
  }, [logDebug, stopReconnectTimer])

  const emitTestKeyPress = useCallback((key: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('testKeyPress', key)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
    emitTestKeyPress,
  }
}
