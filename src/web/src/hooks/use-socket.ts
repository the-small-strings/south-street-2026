import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type { CurrentSongInfo } from '@/lib/types'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface UseSocketOptions {
  onGameStateUpdate?: (info: CurrentSongInfo) => void
  onSkipReveal?: () => void
}

export function useSocket(optionsOrCallback?: UseSocketOptions | ((info: CurrentSongInfo) => void)) {
  const socketRef = useRef<Socket | null>(null)
  
  // Support both old callback style and new options style
  const options: UseSocketOptions = typeof optionsOrCallback === 'function' 
    ? { onGameStateUpdate: optionsOrCallback }
    : optionsOrCallback ?? {}

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

    if (options.onGameStateUpdate) {
      socketRef.current.on('gameStateUpdate', options.onGameStateUpdate)
    }

    if (options.onSkipReveal) {
      socketRef.current.on('skipReveal', options.onSkipReveal)
    }

    return socketRef.current
  }, [options.onGameStateUpdate, options.onSkipReveal])

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

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return {
    socket: socketRef.current,
    connect,
    disconnect,
    emitSkipReveal,
  }
}
