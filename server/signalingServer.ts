import { createServer } from 'node:http'
import { WebSocketServer } from 'ws'
import { SessionRouter } from './sessionRouter.js'
import { parseAndValidateSignalMessage } from './messageValidator.js'
import { QueueCoordinator } from './queueCoordinator.js'

const PORT = Number(process.env.SIGNALING_PORT ?? 8080)
const SIGNALING_PATH = '/ws/signaling'

const router = new SessionRouter()
const queue = new QueueCoordinator()
const httpServer = createServer()
const wsServer = new WebSocketServer({ noServer: true })

httpServer.on('upgrade', (request, socket, head) => {
  const pathname = request.url ? new URL(request.url, 'http://localhost').pathname : ''

  if (pathname !== SIGNALING_PATH) {
    socket.destroy()
    return
  }

  wsServer.handleUpgrade(request, socket, head, (client) => {
    wsServer.emit('connection', client, request)
  })
})

wsServer.on('connection', (socket) => {
  router.register(socket)

  socket.on('message', (data, isBinary) => {
    if (isBinary) {
      return
    }

    const raw = data.toString('utf8')
    const parsed = parseAndValidateSignalMessage(raw)
    if (!parsed.ok) {
      socket.send(
        JSON.stringify({
          event: 'server-error',
          reason: parsed.error,
          timestamp: Date.now(),
        }),
      )
      return
    }

    const message = parsed.message

    if (message.event === 'join') {
      if (!message.role) {
        return
      }

      const joinResult = queue.onJoin(socket, message.sessionId, message.role)
      if (!joinResult.accepted) {
        socket.send(
          JSON.stringify({
            event: 'server-error',
            reason: joinResult.reason,
            timestamp: Date.now(),
          }),
        )
        return
      }

      router.join(socket, message.sessionId, message.role)
      return
    }

    if (message.event === 'leave') {
      router.broadcastToPeers(socket, message)
      queue.onLeave(socket)
      router.leave(socket)
      return
    }

    router.broadcastToPeers(socket, message)
  })

  socket.on('close', () => {
    queue.onDisconnect(socket)
    router.remove(socket)
  })

  socket.on('error', (error) => {
    console.error('Signaling socket error:', error)
    queue.onDisconnect(socket)
    router.remove(socket)
  })
})

httpServer.listen(PORT, () => {
  console.log(`Signaling server running on ws://localhost:${PORT}${SIGNALING_PATH}`)
  console.log('Initial queue stats:', queue.getStats())
})
