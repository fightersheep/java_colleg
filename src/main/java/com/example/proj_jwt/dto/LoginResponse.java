package com.example.proj_jwt.dto;

import java.util.List;
public record LoginResponse(
        String refreshToken,
        String refreshTokenType,     // "Bearer"
        long refreshExpiresInMs,
        String accessToken,
        String accessTokenType,     // "Bearer"
        long accessTokenExpiresInMs,
        String username,
        List<String> roles) {
}