package com.videoshop.backend.signaling;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class SignalingWebSocketHandler extends TextWebSocketHandler {

	private static final Logger logger = LoggerFactory.getLogger(SignalingWebSocketHandler.class);

	private final SessionRouter sessionRouter;
	private final QueueCoordinator queueCoordinator;
	private final SignalMessageValidator signalMessageValidator;
	private final ObjectMapper objectMapper;

	public SignalingWebSocketHandler(
		SessionRouter sessionRouter,
		QueueCoordinator queueCoordinator,
		SignalMessageValidator signalMessageValidator,
		ObjectMapper objectMapper
	) {
		this.sessionRouter = sessionRouter;
		this.queueCoordinator = queueCoordinator;
		this.signalMessageValidator = signalMessageValidator;
		this.objectMapper = objectMapper;
	}

	@Override
	public void afterConnectionEstablished(WebSocketSession session) {
		sessionRouter.register(session);
	}

	@Override
	protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
		SignalMessageValidator.ParsedSignalResult parsed = signalMessageValidator.parseAndValidate(message.getPayload());
		if (!parsed.ok()) {
			sendServerError(session, parsed.error(), null);
			return;
		}

		ParsedSignalMessage signalMessage = parsed.message();

		if ("join".equals(signalMessage.event())) {
			QueueCoordinator.JoinResult joinResult =
				queueCoordinator.onJoin(session, signalMessage.sessionId(), signalMessage.role());
			if (!joinResult.accepted()) {
				sendServerError(session, joinResult.reason(), signalMessage.sessionId());
				return;
			}

			sessionRouter.join(session, signalMessage.sessionId(), signalMessage.role());
			return;
		}

		if ("leave".equals(signalMessage.event())) {
			sessionRouter.broadcastToPeers(session, signalMessage.rawPayload());
			queueCoordinator.onLeave(session);
			sessionRouter.leave(session);
			return;
		}

		sessionRouter.broadcastToPeers(session, signalMessage.rawPayload());
	}

	@Override
	public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
		logger.error("Signaling socket error for session {}", session.getId(), exception);
		queueCoordinator.onDisconnect(session);
		sessionRouter.remove(session);
		super.handleTransportError(session, exception);
	}

	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
		queueCoordinator.onDisconnect(session);
		sessionRouter.remove(session);
	}

	private void sendServerError(WebSocketSession session, String reason, String sessionId) throws IOException {
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("event", "server-error");
		payload.put("reason", reason);
		payload.put("timestamp", System.currentTimeMillis());
		if (sessionId != null) {
			payload.put("sessionId", sessionId);
		}

		session.sendMessage(new TextMessage(serialize(payload)));
	}

	private String serialize(Map<String, Object> payload) throws JsonProcessingException {
		return objectMapper.writeValueAsString(payload);
	}
}