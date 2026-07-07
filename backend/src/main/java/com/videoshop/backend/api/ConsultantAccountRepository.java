package com.videoshop.backend.api;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConsultantAccountRepository extends JpaRepository<ConsultantAccountEntity, Long> {

	Optional<ConsultantAccountEntity> findByUsername(String username);

	boolean existsByUsername(String username);
}