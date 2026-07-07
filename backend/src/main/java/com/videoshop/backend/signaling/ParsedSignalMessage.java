package com.videoshop.backend.signaling;

public record ParsedSignalMessage(
	String event,
	String sessionId,
	long timestamp,
	ParticipantRole role,
	String source,
	String reason,
	String rawPayload
) {
}