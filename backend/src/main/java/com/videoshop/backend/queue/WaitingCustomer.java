package com.videoshop.backend.queue;

import java.time.Instant;

public class WaitingCustomer {
    private final String sessionId;
    private final String source;
    private final Instant joinedAt;
    private QueueStatus status;

    public WaitingCustomer(String sessionId, String source) {
        this.sessionId = sessionId;
        this.source = source;
        this.joinedAt = Instant.now();
        this.status = QueueStatus.WAITING;
    }

    public String getSessionId() {
        return sessionId;
    }

    public String getSource() {
        return source;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public QueueStatus getStatus() {
        return status;
    }

    public void assign() {
        this.status = QueueStatus.ASSIGNED;
    }

    public void leave() {
        this.status = QueueStatus.LEFT;
    }
}
