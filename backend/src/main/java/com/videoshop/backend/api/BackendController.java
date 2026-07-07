package com.videoshop.backend.api;

import com.videoshop.backend.signaling.QueueCoordinator;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api")
public class BackendController {

	private final QueueCoordinator queueCoordinator;
	private final ConsultantAuthService consultantAuthService;

	public BackendController(QueueCoordinator queueCoordinator, ConsultantAuthService consultantAuthService) {
		this.queueCoordinator = queueCoordinator;
		this.consultantAuthService = consultantAuthService;
	}

	@GetMapping("/health")
	public HealthResponse health() {
		return new HealthResponse("ok");
	}

	@GetMapping("/queue/stats")
	public QueueCoordinator.QueueStats queueStats() {
		return queueCoordinator.getStats();
	}

	@PostMapping("/consultants/login")
	public ResponseEntity<ConsultantLoginResponse> consultantLogin(
		@Valid @RequestBody ConsultantLoginRequest request
	) {
		ConsultantAuthService.AuthenticationResult result =
			consultantAuthService.authenticate(request.username(), request.password());

		if (!result.authenticated()) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(new ConsultantLoginResponse(false, null, result.message()));
		}

		return ResponseEntity.ok(
			new ConsultantLoginResponse(true, result.name(), result.message())
		);
	}

	@PostMapping("/consultants/register")
	public ResponseEntity<ConsultantRegisterResponse> consultantRegister(
		@Valid @RequestBody ConsultantRegisterRequest request
	) {
		ConsultantAuthService.RegistrationResult result = consultantAuthService.register(
			request.username(),
			request.password(),
			request.name()
		);

		if (!result.registered()) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(new ConsultantRegisterResponse(false, result.message()));
		}

		return ResponseEntity.status(HttpStatus.CREATED)
			.body(new ConsultantRegisterResponse(true, result.message()));
	}

	public record HealthResponse(String status) {
	}

	public record ConsultantLoginRequest(@NotBlank String username, @NotBlank String password) {
	}

	public record ConsultantRegisterRequest(
		@NotBlank String username,
		@NotBlank String password,
		@NotBlank String name
	) {
	}

	public record ConsultantLoginResponse(boolean authenticated, String name, String message) {
	}

	public record ConsultantRegisterResponse(boolean registered, String message) {
	}
}