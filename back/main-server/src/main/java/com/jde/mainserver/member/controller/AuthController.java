package com.jde.mainserver.member.controller;

import com.jde.mainserver.global.api.ApiResponse;
import com.jde.mainserver.global.exception.code.GeneralSuccessCode;
import com.jde.mainserver.member.dto.request.LoginRequest;
import com.jde.mainserver.member.dto.request.SignUpRequest;
import com.jde.mainserver.member.dto.response.TokenResponse;
import com.jde.mainserver.member.service.command.AuthCommandService;
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
        System.out.println("[DEBUG] >>> /auth/signup called with name=" + request.getName());
        try {
            authCommandService.signUp(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.onSuccess(GeneralSuccessCode.CREATED));
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
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
