package com.example.proj_jwt.dto;

import java.util.List;

public record LoginResponse(
        String token,
        String tokenType,     // "Bearer"
        long expiresInMs,
        String username,
        List<String> roles) {
}