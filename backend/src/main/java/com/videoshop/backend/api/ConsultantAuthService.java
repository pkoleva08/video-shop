package com.videoshop.backend.api;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConsultantAuthService {

	private final ConsultantAccountRepository repository;
	private final String defaultUsername;
	private final String defaultPassword;
	private final String defaultName;

	public ConsultantAuthService(
		ConsultantAccountRepository repository,
		@Value("${videoshop.consultant.username}") String username,
		@Value("${videoshop.consultant.password}") String password,
		@Value("${videoshop.consultant.name}") String name
	) {
		this.repository = repository;
		this.defaultUsername = username;
		this.defaultPassword = password;
		this.defaultName = name;
	}

	@PostConstruct
	@Transactional
	public void seedDefaultConsultant() {
		if (defaultUsername.isBlank() || defaultPassword.isBlank()) {
			return;
		}

		if (!repository.existsByUsername(defaultUsername)) {
			repository.save(new ConsultantAccountEntity(defaultUsername, defaultPassword, defaultName));
		}
	}

	@Transactional(readOnly = true)
	public AuthenticationResult authenticate(String candidateUsername, String candidatePassword) {
		String normalizedUsername = candidateUsername.trim();
		ConsultantAccountEntity account = repository.findByUsername(normalizedUsername).orElse(null);
		if (account == null || !account.getPassword().equals(candidatePassword)) {
			return new AuthenticationResult(false, null, "Invalid username or password.");
		}

		return new AuthenticationResult(true, account.getName(), "Login successful.");
	}

	@Transactional
	public RegistrationResult register(String username, String password, String name) {
		String normalizedUsername = username.trim();
		String normalizedPassword = password.trim();
		String normalizedName = name.trim();

		if (normalizedUsername.length() < 3) {
			return new RegistrationResult(false, "Username must be at least 3 characters.");
		}

		if (normalizedPassword.length() < 6) {
			return new RegistrationResult(false, "Password must be at least 6 characters.");
		}

		if (normalizedName.isEmpty()) {
			return new RegistrationResult(false, "Name is required.");
		}

		if (repository.existsByUsername(normalizedUsername)) {
			return new RegistrationResult(false, "Username already exists.");
		}

		repository.save(new ConsultantAccountEntity(normalizedUsername, normalizedPassword, normalizedName));

		return new RegistrationResult(true, "Registration successful. Please log in.");
	}

	public record AuthenticationResult(boolean authenticated, String name, String message) {
	}

	public record RegistrationResult(boolean registered, String message) {
	}
}