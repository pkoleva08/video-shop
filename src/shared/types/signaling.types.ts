export type ParticipantRole = 'customer' | 'consultant'

export interface SignalingEnvelope {
	sessionId: string
	timestamp: number
}

export interface JoinMessage extends SignalingEnvelope {
	event: 'join'
	role: ParticipantRole
	source: string
}

export interface LeaveMessage extends SignalingEnvelope {
	event: 'leave'
	reason?: string
}

export interface OfferMessage extends SignalingEnvelope {
	event: 'offer'
	sdp: RTCSessionDescriptionInit
}

export interface AnswerMessage extends SignalingEnvelope {
	event: 'answer'
	sdp: RTCSessionDescriptionInit
}

export interface IceCandidateMessage extends SignalingEnvelope {
	event: 'ice-candidate'
	candidate: RTCIceCandidateInit
}

export interface HangupMessage extends SignalingEnvelope {
	event: 'hangup'
}

export type SignalMessage =
	| JoinMessage
	| LeaveMessage
	| OfferMessage
	| AnswerMessage
	| IceCandidateMessage
	| HangupMessage

