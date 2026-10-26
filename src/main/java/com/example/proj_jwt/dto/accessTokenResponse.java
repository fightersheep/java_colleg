package com.example.proj_jwt.dto;

import org.springframework.security.core.Authentication;

import java.util.List;

public record accessTokenResponse(
        String accessToken,
        String accessTokenType,     // "Bearer"
        long accessTokenExpiresInMs,
        String username,
        List<String> roles) {

}
