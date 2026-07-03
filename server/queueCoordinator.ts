import { WebSocket } from 'ws'
import type { ParticipantRole } from './sessionRouter.js'

interface SessionSlots {
  customer?: WebSocket
  consultant?: WebSocket
}

interface ParticipantInfo {
  sessionId: string
  role: ParticipantRole
}

interface JoinResultAccepted {
  accepted: true
}

interface JoinResultRejected {
  accepted: false
  reason: string
}

export type JoinResult = JoinResultAccepted | JoinResultRejected

export class QueueCoordinator {
  private readonly sessions = new Map<string, SessionSlots>()
  private readonly participants = new WeakMap<WebSocket, ParticipantInfo>()

  onJoin(socket: WebSocket, sessionId: string, role: ParticipantRole): JoinResult {
    this.onDisconnect(socket)

    const slots = this.sessions.get(sessionId) ?? {}

    if (role === 'customer' && slots.customer && slots.customer !== socket) {
      return { accepted: false, reason: 'Session already has a customer connected.' }
    }

    if (role === 'consultant' && slots.consultant && slots.consultant !== socket) {
      return { accepted: false, reason: 'Session already has a consultant connected.' }
    }

    if (role === 'customer') {
      slots.customer = socket
    } else {
      slots.consultant = socket
    }

    this.sessions.set(sessionId, slots)
    this.participants.set(socket, { sessionId, role })
    return { accepted: true }
  }

  onLeave(socket: WebSocket): void {
    this.onDisconnect(socket)
  }

  onDisconnect(socket: WebSocket): void {
    const info = this.participants.get(socket)
    this.participants.delete(socket)

    if (!info) {
      return
    }

    const slots = this.sessions.get(info.sessionId)
    if (!slots) {
      return
    }

    if (info.role === 'customer' && slots.customer === socket) {
      slots.customer = undefined
    }

    if (info.role === 'consultant' && slots.consultant === socket) {
      slots.consultant = undefined
    }

    if (!slots.customer && !slots.consultant) {
      this.sessions.delete(info.sessionId)
    }
  }

  getStats(): { activeSessions: number; waitingCustomers: number; waitingConsultants: number } {
    let waitingCustomers = 0
    let waitingConsultants = 0

    for (const slots of this.sessions.values()) {
      if (slots.customer && !slots.consultant) {
        waitingCustomers += 1
      }

      if (!slots.customer && slots.consultant) {
        waitingConsultants += 1
      }
    }

    return {
      activeSessions: this.sessions.size,
      waitingCustomers,
      waitingConsultants,
    }
  }
}
