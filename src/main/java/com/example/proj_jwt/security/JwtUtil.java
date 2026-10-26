package com.example.proj_jwt.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;

/**
 * Creates and verifies JWT tokens (HMAC-SHA256 signature with a server-side secret).
 */
@Component
public class JwtUtil {

    private final SecretKey key;
    @Getter
    private final long expirationMs;
    @Getter
    private final long refreshexpirationMs;


    public JwtUtil(@Value("${jwt.secret}") String base64Secret,
                   @Value("${jwt.expiration-ms}") long expirationMs,
                   @Value("${jwt.refreshexpiration-ms}") long refreshexpirationMs) {
        // Throws WeakKeyException if the secret is shorter than 256 bits
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64Secret));
        this.expirationMs = expirationMs;
        this.refreshexpirationMs = refreshexpirationMs;
    }

    /** Called after a successful login. */
    public String generateAccessToken(UserDetails userDetails) {
        Date now = new Date();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        return Jwts.builder()
                .subject(userDetails.getUsername())                 // "sub"
                .claim("roles", roles)                              // custom claim, for the client to read
                .issuedAt(now)                                      // "iat"
                .expiration(new Date(now.getTime() + expirationMs)) // "exp"
                .signWith(key)                                      // HS256 for a 256-bit key
                .compact();                                         // header.payload.signature
    }

    /**
     * Verifies the signature and the expiry, then returns the payload.
     * Throws JwtException (SignatureException, ExpiredJwtException, MalformedJwtException ...)
     * if the token was changed, expired or is not a JWT.
     */
    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public String generateRefreshToken(UserDetails userDetails) {
        Date now = new Date();
        return Jwts.builder()
                .subject(userDetails.getUsername())                 // "sub"
                .issuedAt(now)                                      // "iat"
                .expiration(new Date(now.getTime() + refreshexpirationMs)) // "exp"
                .signWith(key)                                      // HS256 for a 256-bit key
                .compact();                                         // header.payload.signature
    }

}