import { useEffect, useRef, useCallback, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import type { GigState } from '@/lib/types'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:33001'
const RECONNECT_INTERVAL = 3000 // 3 seconds between reconnection attempts

interface UseSocketOptions {
  onGameStateUpdate?: (info: GigState) => void
  onTestKeyPress?: (key: string) => void
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

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current?.id)
      setIsConnected(true)
      stopReconnectTimer()
    })

    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      setIsConnected(false)
      startReconnectTimer()
    })

    socketRef.current.on('connect_error', (error) => {
      console.log('Socket connection error:', error.message)
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
  }, [stopReconnectTimer])

  const startReconnectTimer = useCallback(() => {
    // Don't start a new timer if one is already running
    if (reconnectTimerRef.current) return

    console.log('Starting reconnection timer...')
    reconnectTimerRef.current = setInterval(() => {
      if (!socketRef.current?.connected) {
        console.log('Attempting to reconnect...')
        connect()
      } else {
        stopReconnectTimer()
      }
    }, RECONNECT_INTERVAL)
  }, [connect, stopReconnectTimer])

  const disconnect = useCallback(() => {
    stopReconnectTimer()
    if (socketRef.current) {
      socketRef.current.removeAllListeners()
      socketRef.current.disconnect()
      socketRef.current = null
    }
    setIsConnected(false)
  }, [stopReconnectTimer])

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
