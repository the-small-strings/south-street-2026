import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type { CurrentSongInfo } from '@/lib/types'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function useSocket(onGameStateUpdate?: (info: CurrentSongInfo) => void) {
  const socketRef = useRef<Socket | null>(null)

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

    if (onGameStateUpdate) {
      socketRef.current.on('gameStateUpdate', onGameStateUpdate)
    }

    return socketRef.current
  }, [onGameStateUpdate])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
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
  }
}
