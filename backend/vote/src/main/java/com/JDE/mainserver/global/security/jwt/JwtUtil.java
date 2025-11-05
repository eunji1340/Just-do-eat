package com.JDE.mainserver.global.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import java.security.Key;
import java.util.Date;

public class JwtUtil {

    private final Key secretKey;
    private final long accessTokenTtlMs;
    private final long refreshTokenTtlMs;

    public JwtUtil(String base64Secret, long accessTokenTtlMs, long refreshTokenTtlMs) {
        this.secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64Secret));
        this.accessTokenTtlMs = accessTokenTtlMs;
        this.refreshTokenTtlMs = refreshTokenTtlMs;
    }

    public String createAccessToken(String subject) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + accessTokenTtlMs);
        return Jwts.builder()
                .subject(subject)
                .issuedAt(now)
                .expiration(exp)
                .signWith(secretKey)
                .compact();
    }

    public String createRefreshToken(String subject) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + refreshTokenTtlMs);
        return Jwts.builder()
                .subject(subject)
                .issuedAt(now)
                .expiration(exp)
                .signWith(secretKey)
                .compact();
    }

    public Jws<Claims> parse(String token) {
        return Jwts.parser()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token);
    }

    public boolean validate(String token) {
        try {
            parse(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String getSubject(String token) {
        return parse(token).getBody().getSubject();
    }
}
