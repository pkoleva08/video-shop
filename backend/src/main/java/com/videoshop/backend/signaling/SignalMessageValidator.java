package com.videoshop.backend.signaling;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Set;

@Component
public class SignalMessageValidator {

	private static final Set<String> SIGNAL_EVENTS = Set.of(
		"join",
		"leave",
		"offer",
		"answer",
		"ice-candidate",
		"hangup"
	);

	private final ObjectMapper objectMapper;

	public SignalMessageValidator(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
	}

	public ParsedSignalResult parseAndValidate(String rawPayload) {
		final JsonNode root;

		try {
			root = objectMapper.readTree(rawPayload);
		} catch (IOException exception) {
			return ParsedSignalResult.error("Invalid JSON payload.");
		}

		if (root == null || !root.isObject()) {
			return ParsedSignalResult.error("Payload must be an object.");
		}

		JsonNode eventNode = root.get("event");
		JsonNode sessionIdNode = root.get("sessionId");
		JsonNode timestampNode = root.get("timestamp");

		if (eventNode == null || !eventNode.isTextual() || !SIGNAL_EVENTS.contains(eventNode.asText())) {
			return ParsedSignalResult.error("Unknown signaling event.");
		}

		String event = eventNode.asText();

		if (sessionIdNode == null || !sessionIdNode.isTextual() || sessionIdNode.asText().trim().length() < 4) {
			return ParsedSignalResult.error("sessionId must be a non-empty string with minimum length 4.");
		}

		if (timestampNode == null || !timestampNode.isNumber()) {
			return ParsedSignalResult.error("timestamp must be a finite number.");
		}

		ParticipantRole role = null;
		String source = null;
		String reason = null;

		if ("join".equals(event)) {
			JsonNode roleNode = root.get("role");
			role = roleNode != null && roleNode.isTextual() ? ParticipantRole.fromWireValue(roleNode.asText()) : null;

			if (role == null) {
				return ParsedSignalResult.error("join.role must be customer or consultant.");
			}

			JsonNode sourceNode = root.get("source");
			if (sourceNode == null || !sourceNode.isTextual() || sourceNode.asText().trim().isEmpty()) {
				return ParsedSignalResult.error("join.source must be a non-empty string.");
			}

			source = sourceNode.asText();
		}

		if (("offer".equals(event) || "answer".equals(event)) && !isObjectNode(root.get("sdp"))) {
			return ParsedSignalResult.error(event + ".sdp must be an object.");
		}

		if ("ice-candidate".equals(event) && !isObjectNode(root.get("candidate"))) {
			return ParsedSignalResult.error("ice-candidate.candidate must be an object.");
		}

		JsonNode reasonNode = root.get("reason");
		if (reasonNode != null && reasonNode.isTextual()) {
			reason = reasonNode.asText();
		}

		return ParsedSignalResult.ok(new ParsedSignalMessage(
			event,
			sessionIdNode.asText(),
			timestampNode.asLong(),
			role,
			source,
			reason,
			rawPayload
		));
	}

	private boolean isObjectNode(JsonNode node) {
		return node != null && node.isObject();
	}

	public record ParsedSignalResult(boolean ok, ParsedSignalMessage message, String error) {
		public static ParsedSignalResult ok(ParsedSignalMessage message) {
			return new ParsedSignalResult(true, message, null);
		}

		public static ParsedSignalResult error(String error) {
			return new ParsedSignalResult(false, null, error);
		}
	}
}