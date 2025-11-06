package com.JDE.mainserver.global.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.util.Date;

public class JwtUtil {

    private final SecretKey secretKey;
    private final long accessTokenTtlMs;
    private final long refreshTokenTtlMs;

    public JwtUtil(String base64Secret, long accessTokenTtlMs, long refreshTokenTtlMs) {
        this.secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64Secret));
        this.accessTokenTtlMs = accessTokenTtlMs;
        this.refreshTokenTtlMs = refreshTokenTtlMs;
    }

    public String createAccessToken(String subject) { return createToken(subject, accessTokenTtlMs); }
    public String createRefreshToken(String subject) { return createToken(subject, refreshTokenTtlMs); }

    private String createToken(String subject, long ttlMs) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + ttlMs);
        return Jwts.builder()
                .subject(subject)
                .issuedAt(now)
                .expiration(exp)
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public Jws<Claims> parse(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token);
    }

    public boolean validate(String token) {
        try {
            Jws<Claims> jws = parse(token);
            Date exp = jws.getPayload().getExpiration();
            return exp == null || exp.after(new Date());
        } catch (Exception e) { return false; }
    }

    public String getSubject(String token) {
        return parse(token).getPayload().getSubject();
    }
}
