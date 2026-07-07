package com.videoshop.backend.signaling;

public enum ParticipantRole {
	CUSTOMER("customer"),
	CONSULTANT("consultant");

	private final String wireValue;

	ParticipantRole(String wireValue) {
		this.wireValue = wireValue;
	}

	public String wireValue() {
		return wireValue;
	}

	public static ParticipantRole fromWireValue(String value) {
		for (ParticipantRole role : values()) {
			if (role.wireValue.equals(value)) {
				return role;
			}
		}

		return null;
	}
}