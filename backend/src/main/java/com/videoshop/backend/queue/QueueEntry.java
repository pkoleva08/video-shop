package com.videoshop.backend.queue;

import java.time.Instant;
import java.util.UUID;

public class QueueEntry {
    private final String id;
    private final String sessionId;
    private final String customerSource;
    private final Instant joinedAt;
    
    public QueueEntry(String sessionId, String customerSource) {
        this.id = UUID.randomUUID().toString();
        this.sessionId = sessionId;
        this.customerSource = customerSource;
        this.joinedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public String getSessionId() {
        return sessionId;
    }

    public String getCustomerSource() {
        return customerSource;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }
}
