package com.videoshop.backend.signaling;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class QueueCoordinator {

	private final Map<String, SessionSlots> sessions = new ConcurrentHashMap<>();
	private final Map<String, ParticipantState> participants = new ConcurrentHashMap<>();

	public synchronized JoinResult onJoin(WebSocketSession session, String sessionId, ParticipantRole role) {
		onDisconnect(session);

		SessionSlots slots = sessions.getOrDefault(sessionId, new SessionSlots());

		if (role == ParticipantRole.CUSTOMER && slots.customer() != null && !slots.customer().equals(session)) {
			return JoinResult.reject("Session already has a customer connected.");
		}

		if (role == ParticipantRole.CONSULTANT && slots.consultant() != null && !slots.consultant().equals(session)) {
			return JoinResult.reject("Session already has a consultant connected.");
		}

		if (role == ParticipantRole.CUSTOMER) {
			slots = slots.withCustomer(session);
		} else {
			slots = slots.withConsultant(session);
		}

		sessions.put(sessionId, slots);
		participants.put(session.getId(), new ParticipantState(sessionId, role));
		return JoinResult.accept();
	}

	public synchronized void onLeave(WebSocketSession session) {
		onDisconnect(session);
	}

	public synchronized void onDisconnect(WebSocketSession session) {
		ParticipantState info = participants.remove(session.getId());
		if (info == null || info.sessionId() == null || info.role() == null) {
			return;
		}

		SessionSlots slots = sessions.get(info.sessionId());
		if (slots == null) {
			return;
		}

		if (info.role() == ParticipantRole.CUSTOMER && session.equals(slots.customer())) {
			slots = slots.withCustomer(null);
		}

		if (info.role() == ParticipantRole.CONSULTANT && session.equals(slots.consultant())) {
			slots = slots.withConsultant(null);
		}

		if (slots.customer() == null && slots.consultant() == null) {
			sessions.remove(info.sessionId());
			return;
		}

		sessions.put(info.sessionId(), slots);
	}

	public synchronized QueueStats getStats() {
		int waitingCustomers = 0;
		int waitingConsultants = 0;

		for (SessionSlots slots : sessions.values()) {
			if (slots.customer() != null && slots.consultant() == null) {
				waitingCustomers += 1;
			}

			if (slots.customer() == null && slots.consultant() != null) {
				waitingConsultants += 1;
			}
		}

		return new QueueStats(sessions.size(), waitingCustomers, waitingConsultants);
	}

	public record JoinResult(boolean accepted, String reason) {
		public static JoinResult accept() {
			return new JoinResult(true, null);
		}

		public static JoinResult reject(String reason) {
			return new JoinResult(false, reason);
		}
	}

	public record QueueStats(int activeSessions, int waitingCustomers, int waitingConsultants) {
	}

	private record SessionSlots(WebSocketSession customer, WebSocketSession consultant) {
		private SessionSlots() {
			this(null, null);
		}

		private SessionSlots withCustomer(WebSocketSession customer) {
			return new SessionSlots(customer, consultant);
		}

		private SessionSlots withConsultant(WebSocketSession consultant) {
			return new SessionSlots(customer, consultant);
		}
	}
}