import type { AnswerMessage, HangupMessage, IceCandidateMessage, JoinMessage, LeaveMessage, OfferMessage, ParticipantRole, ServerErrorMessage, SignalMessage } 
	from '../../shared/types/signaling.types'

const SIGNAL_EVENTS = new Set([ 'join', 'leave', 'offer', 'answer', 'ice-candidate', 'hangup', 'server-error' ])

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null
}

function createEnvelope(sessionId: string) {
	return {
		sessionId,
		timestamp: Date.now(),
	}
}

export function isSignalMessage(value: unknown): value is SignalMessage {
	if (!isRecord(value)) {
		return false
	}

	const event = value.event
	if (typeof event !== 'string' || !SIGNAL_EVENTS.has(event)) {
		return false
	}

	if (event === 'server-error') {
		return typeof value.timestamp === 'number' && typeof value.reason === 'string'
	}

	return typeof value.sessionId === 'string' && typeof value.timestamp === 'number'
}

export function parseSignalMessage(raw: string): SignalMessage | null {
	try {
		const parsed = JSON.parse(raw) as unknown
		return isSignalMessage(parsed) ? parsed : null
	} catch {
		return null
	}
}

export function serializeSignalMessage(message: SignalMessage): string {
	return JSON.stringify(message)
}

export function createJoinMessage(sessionId: string, role: ParticipantRole, source: string): JoinMessage {
	return {
		event: 'join', role, source, ...createEnvelope(sessionId),
	}
}

export function createLeaveMessage(sessionId: string, reason?: string): LeaveMessage {
	return {
		event: 'leave', reason, ...createEnvelope(sessionId),
	}
}

export function createOfferMessage(sessionId: string, sdp: RTCSessionDescriptionInit): OfferMessage {
	return {
		event: 'offer', sdp, ...createEnvelope(sessionId),
	}
}

export function createAnswerMessage(sessionId: string, sdp: RTCSessionDescriptionInit): AnswerMessage {
	return {
		event: 'answer', sdp, ...createEnvelope(sessionId),
	}	
}

export function createIceCandidateMessage(sessionId: string, candidate: RTCIceCandidateInit): IceCandidateMessage {
	return {
		event: 'ice-candidate', candidate, ...createEnvelope(sessionId),
	}
}

export function createHangupMessage(sessionId: string): HangupMessage {
	return {
		event: 'hangup', ...createEnvelope(sessionId),
	}
}

export function createServerErrorMessage(reason: string, sessionId?: string): ServerErrorMessage {
	return {
		event: 'server-error',
		reason,
		timestamp: Date.now(),
		sessionId,
	}
}

