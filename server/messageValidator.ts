import type { ParticipantRole, SignalMessage } from './sessionRouter.js'

interface ParsedOk {
  ok: true
  message: SignalMessage
}

interface ParsedErr {
  ok: false
  error: string
}

export type ParsedSignalResult = ParsedOk | ParsedErr

const SIGNAL_EVENTS = new Set<SignalMessage['event']>([
  'join',
  'leave',
  'offer',
  'answer',
  'ice-candidate',
  'hangup',
])

export function parseAndValidateSignalMessage(raw: string): ParsedSignalResult {
  let parsed: unknown

  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    return { ok: false, error: 'Invalid JSON payload.' }
  }

  if (!isRecord(parsed)) {
    return { ok: false, error: 'Payload must be an object.' }
  }

  const event = parsed.event
  const sessionId = parsed.sessionId
  const timestamp = parsed.timestamp

  if (typeof event !== 'string' || !SIGNAL_EVENTS.has(event as SignalMessage['event'])) {
    return { ok: false, error: 'Unknown signaling event.' }
  }

  const typedEvent = event as SignalMessage['event']

  if (typeof sessionId !== 'string' || sessionId.trim().length < 4) {
    return { ok: false, error: 'sessionId must be a non-empty string with minimum length 4.' }
  }

  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) {
    return { ok: false, error: 'timestamp must be a finite number.' }
  }

  if (typedEvent === 'join') {
    if (!isParticipantRole(parsed.role)) {
      return { ok: false, error: 'join.role must be customer or consultant.' }
    }

    if (typeof parsed.source !== 'string' || parsed.source.trim().length === 0) {
      return { ok: false, error: 'join.source must be a non-empty string.' }
    }
  }

  if ((typedEvent === 'offer' || typedEvent === 'answer') && !isRecord(parsed.sdp)) {
    return { ok: false, error: `${typedEvent}.sdp must be an object.` }
  }

  if (typedEvent === 'ice-candidate' && !isRecord(parsed.candidate)) {
    return { ok: false, error: 'ice-candidate.candidate must be an object.' }
  }

  return {
    ok: true,
    message: {
      event: typedEvent,
      sessionId,
      timestamp,
      role: isParticipantRole(parsed.role) ? parsed.role : undefined,
      source: typeof parsed.source === 'string' ? parsed.source : undefined,
      reason: typeof parsed.reason === 'string' ? parsed.reason : undefined,
      sdp: parsed.sdp,
      candidate: parsed.candidate,
    },
  }
}

function isParticipantRole(value: unknown): value is ParticipantRole {
  return value === 'customer' || value === 'consultant'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
