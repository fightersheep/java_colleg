package com.example.proj_jwt.repository;

import com.example.proj_jwt.entity.Role;
import com.example.proj_jwt.entity.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByName(RoleName name);
}
