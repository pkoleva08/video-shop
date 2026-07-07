package com.videoshop.backend.signaling;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SessionRouter {

	private final Map<String, Set<WebSocketSession>> sessions = new ConcurrentHashMap<>();
	private final Map<String, ParticipantState> participants = new ConcurrentHashMap<>();

	public synchronized void register(WebSocketSession session) {
		participants.put(session.getId(), new ParticipantState(null, null));
	}

	public synchronized void remove(WebSocketSession session) {
		ParticipantState state = participants.remove(session.getId());
		if (state == null || state.sessionId() == null) {
			return;
		}

		Set<WebSocketSession> peers = sessions.get(state.sessionId());
		if (peers == null) {
			return;
		}

		peers.remove(session);
		if (peers.isEmpty()) {
			sessions.remove(state.sessionId());
		}
	}

	public synchronized void join(WebSocketSession session, String sessionId, ParticipantRole role) {
		remove(session);

		Set<WebSocketSession> peers = sessions.computeIfAbsent(sessionId, ignored -> new HashSet<>());
		peers.add(session);
		participants.put(session.getId(), new ParticipantState(sessionId, role));
	}

	public synchronized void leave(WebSocketSession session) {
		remove(session);
		participants.put(session.getId(), new ParticipantState(null, null));
	}

	public synchronized int broadcastToPeers(WebSocketSession sender, String rawPayload) {
		ParticipantState state = participants.get(sender.getId());
		if (state == null || state.sessionId() == null) {
			return 0;
		}

		Set<WebSocketSession> peers = sessions.get(state.sessionId());
		if (peers == null) {
			return 0;
		}

		int delivered = 0;
		TextMessage payload = new TextMessage(rawPayload);

		for (WebSocketSession peer : peers) {
			if (peer.getId().equals(sender.getId()) || !peer.isOpen()) {
				continue;
			}

			try {
				peer.sendMessage(payload);
				delivered += 1;
			} catch (IOException ignored) {
				// Transport cleanup is handled by the session close/error callbacks.
			}
		}

		return delivered;
	}
}