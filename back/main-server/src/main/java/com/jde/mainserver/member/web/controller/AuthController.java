package com.jde.mainserver.member.controller;

import com.jde.mainserver.global.api.ApiResponse;
import com.jde.mainserver.global.exception.code.GeneralSuccessCode;
import com.jde.mainserver.member.dto.request.LoginRequest;
import com.jde.mainserver.member.dto.request.SignUpRequest;
import com.jde.mainserver.member.dto.response.TokenResponse;
import com.jde.mainserver.member.service.command.AuthCommandService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
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

	@Operation(summary = "회원가입", description = "새로운 사용자를 등록합니다.")
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

	@Operation(summary = "로그인", description = "사용자 ID와 비밀번호로 로그인하여 JWT 토큰을 발급받습니다.")
	@PostMapping("/login")
	public ResponseEntity<ApiResponse<TokenResponse>> login(@RequestBody LoginRequest request) {
		TokenResponse token = authCommandService.login(request);
		return ResponseEntity.ok(ApiResponse.onSuccess(GeneralSuccessCode.OK, token));
	}

	@Operation(
		summary = "로그아웃",
		description = "현재 로그인한 사용자를 로그아웃합니다.",
		security = @SecurityRequirement(name = "Json Web Token(JWT)")
	)
	@PostMapping("/logout")
	public ResponseEntity<ApiResponse<Void>> logout(Authentication authentication) {
		Long memberId = currentMemberId(authentication);
		authCommandService.logout(memberId);
		return ResponseEntity.ok(ApiResponse.onSuccess(GeneralSuccessCode.OK));
	}

	private Long currentMemberId(Authentication authentication) {
		String subject = authentication == null ? null : authentication.getName();
		if (subject == null)
			throw new IllegalArgumentException("인증이 필요합니다.");
		try {
			return Long.parseLong(subject);
		} catch (NumberFormatException e) {
			throw new IllegalArgumentException("잘못된 토큰(subject)입니다.");
		}
	}
}
