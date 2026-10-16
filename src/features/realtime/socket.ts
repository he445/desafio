import { io, type Socket } from 'socket.io-client'
import { getSessionToken } from '@/lib/storage'

let socket: Socket | null = null

// Loaded with import() only after worker.start(): engine.io-client keeps the WebSocket
// constructor it finds when the module is evaluated, and only the patched one reaches the mock.
export function getRealtimeSocket(): Socket {
  socket ??= io(import.meta.env.VITE_SOCKET_URL || 'wss://realtime.nft-market.test', {
    // The mock answers WebSocket only; the default long-polling start would hit the network.
    transports: ['websocket'],
    autoConnect: false,
    // Read on every (re)connection, so a login or a logout reaches the server.
    auth: (cb) => cb({ token: getSessionToken() }),
    reconnectionDelay: 500,
    reconnectionDelayMax: 4000,
    randomizationFactor: 0,
  })
  return socket
}
