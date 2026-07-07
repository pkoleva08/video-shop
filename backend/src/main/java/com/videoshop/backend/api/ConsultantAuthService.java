package com.videoshop.backend.api;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ConsultantAuthService {

	private final Map<String, ConsultantAccount> accounts = new ConcurrentHashMap<>();

	public ConsultantAuthService(
		@Value("${videoshop.consultant.username}") String username,
		@Value("${videoshop.consultant.password}") String password,
		@Value("${videoshop.consultant.display-name}") String displayName
	) {
		if (!username.isBlank() && !password.isBlank()) {
			accounts.put(username, new ConsultantAccount(username, password, displayName));
		}
	}

	public AuthenticationResult authenticate(String candidateUsername, String candidatePassword) {
		ConsultantAccount account = accounts.get(candidateUsername);
		if (account == null || !account.password().equals(candidatePassword)) {
			return new AuthenticationResult(false, null, "Invalid username or password.");
		}

		return new AuthenticationResult(true, account.displayName(), "Login successful.");
	}

	public RegistrationResult register(String username, String password, String displayName) {
		String normalizedUsername = username.trim();
		String normalizedPassword = password.trim();
		String normalizedDisplayName = displayName.trim();

		if (normalizedUsername.length() < 3) {
			return new RegistrationResult(false, "Username must be at least 3 characters.");
		}

		if (normalizedPassword.length() < 6) {
			return new RegistrationResult(false, "Password must be at least 6 characters.");
		}

		if (normalizedDisplayName.isEmpty()) {
			return new RegistrationResult(false, "Display name is required.");
		}

		ConsultantAccount newAccount = new ConsultantAccount(
			normalizedUsername,
			normalizedPassword,
			normalizedDisplayName
		);

		ConsultantAccount existing = accounts.putIfAbsent(normalizedUsername, newAccount);
		if (existing != null) {
			return new RegistrationResult(false, "Username already exists.");
		}

		return new RegistrationResult(true, "Registration successful. Please log in.");
	}

	private record ConsultantAccount(String username, String password, String displayName) {
	}

	public record AuthenticationResult(boolean authenticated, String displayName, String message) {
	}

	public record RegistrationResult(boolean registered, String message) {
	}
}