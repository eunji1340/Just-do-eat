package com.JDE.mainserver.web.controller;

import com.JDE.mainserver.global.api.ApiResponse;
import com.JDE.mainserver.global.exception.code.GeneralSuccessCode;
import com.JDE.mainserver.member.service.AuthCommandService;
import com.JDE.mainserver.web.dto.request.LoginRequest;
import com.JDE.mainserver.web.dto.request.SignUpRequest;
import com.JDE.mainserver.web.dto.response.TokenResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthCommandService authCommandService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<Void>> signUp(@RequestBody SignUpRequest request) {
        authCommandService.signUp(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.onSuccess(GeneralSuccessCode.CREATED));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(@RequestBody LoginRequest request) {
        TokenResponse token = authCommandService.login(request);
        return ResponseEntity.ok(ApiResponse.onSuccess(GeneralSuccessCode.OK, token));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(Authentication authentication) {
        Long memberId = currentMemberId(authentication);
        authCommandService.logout(memberId);
        return ResponseEntity.ok(ApiResponse.onSuccess(GeneralSuccessCode.OK));
    }

    private Long currentMemberId(Authentication authentication) {
        String subject = authentication == null ? null : authentication.getName();
        if (subject == null) throw new IllegalArgumentException("인증이 필요합니다.");
        try { return Long.parseLong(subject); }
        catch (NumberFormatException e) { throw new IllegalArgumentException("잘못된 토큰(subject)입니다."); }
    }
}
