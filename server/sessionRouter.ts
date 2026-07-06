 import { WebSocket } from 'ws'

export type ParticipantRole = 'customer' | 'consultant'

export interface SignalMessage {
  event: 'join' | 'leave' | 'offer' | 'answer' | 'ice-candidate' | 'hangup'
  sessionId: string
  timestamp: number
  role?: ParticipantRole
  source?: string
  reason?: string
  sdp?: unknown
  candidate?: unknown
}

interface ParticipantState {
  sessionId: string | null
  role: ParticipantRole | null
}

export class SessionRouter {
  private readonly sessions = new Map<string, Set<WebSocket>>()
  private readonly participants = new WeakMap<WebSocket, ParticipantState>()

  register(socket: WebSocket): void {
    this.participants.set(socket, { sessionId: null, role: null })
  }

  remove(socket: WebSocket): void {
    const state = this.participants.get(socket)
    this.participants.delete(socket)

    if (!state?.sessionId) {
      return
    }

    const peers = this.sessions.get(state.sessionId)
    if (!peers) {
      return
    }

    peers.delete(socket)
    if (peers.size === 0) {
      this.sessions.delete(state.sessionId)
    }
  }

  join(socket: WebSocket, sessionId: string, role: ParticipantRole): void {
    this.remove(socket)

    const peers = this.sessions.get(sessionId) ?? new Set<WebSocket>()
    peers.add(socket)
    this.sessions.set(sessionId, peers)

    this.participants.set(socket, { sessionId, role })
  }

  leave(socket: WebSocket): void {
    this.remove(socket)
    this.participants.set(socket, { sessionId: null, role: null })
  }

  broadcastToPeers(sender: WebSocket, message: SignalMessage): number {
    const state = this.participants.get(sender)
    if (!state?.sessionId) {
      return 0
    }

    const peers = this.sessions.get(state.sessionId)
    if (!peers) {
      return 0
    }

    const payload = JSON.stringify(message)
    let delivered = 0

    for (const peer of peers) {
      if (peer === sender || peer.readyState !== WebSocket.OPEN) {
        continue
      }

      peer.send(payload)
      delivered += 1
    }

    return delivered
  }
}
