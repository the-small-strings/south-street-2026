import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type { CurrentSongInfo } from '@/lib/types'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface UseSocketOptions {
  onGameStateUpdate?: (info: CurrentSongInfo) => void
  onSkipReveal?: () => void
  onTestKeyPress?: (key: string) => void
}

export function useSocket(optionsOrCallback?: UseSocketOptions | ((info: CurrentSongInfo) => void)) {
  const socketRef = useRef<Socket | null>(null)
  
  // Support both old callback style and new options style
  const options: UseSocketOptions = typeof optionsOrCallback === 'function' 
    ? { onGameStateUpdate: optionsOrCallback }
    : optionsOrCallback ?? {}

  // Use refs to store callbacks so socket listeners always call the latest version
  const callbackRefs = useRef<UseSocketOptions>({})
  callbackRefs.current = options

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    })

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current?.id)
    })

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    // Use wrapper functions that call from refs to always get latest callback
    socketRef.current.on('gameStateUpdate', (info: CurrentSongInfo) => {
      callbackRefs.current.onGameStateUpdate?.(info)
    })

    socketRef.current.on('skipReveal', () => {
      callbackRefs.current.onSkipReveal?.()
    })

    socketRef.current.on('testKeyPress', (key: string) => {
      callbackRefs.current.onTestKeyPress?.(key)
    })

    return socketRef.current
  }, [])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
  }, [])

  const emitSkipReveal = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('skipReveal')
    }
  }, [])

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
    connect,
    disconnect,
    emitSkipReveal,
    emitTestKeyPress,
  }
}
