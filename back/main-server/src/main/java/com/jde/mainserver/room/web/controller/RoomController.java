package com.jde.mainserver.room.web.controller;

import com.jde.mainserver.global.annotation.AuthUser;
import com.jde.mainserver.global.api.ApiResponse;
import com.jde.mainserver.global.exception.CustomException;
import com.jde.mainserver.global.exception.code.GeneralErrorCode;
import com.jde.mainserver.room.service.command.CreateRoomCommandService;
import com.jde.mainserver.room.web.dto.request.CreateRoomRequest;
import com.jde.mainserver.room.web.dto.response.CreateRoomResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController // 이 클래스가 REST API를 처리하는 컨트롤러임을 명시
@RequestMapping("/rooms")
@RequiredArgsConstructor // final 필드에 대한 생성자를 자동으로 생성
@Tag(name = "Room", description = "모임 관련 API") // Swagger/OpenAPI 문서화를 위한 태그
public class RoomController {

    private final CreateRoomCommandService createRoomCommandService; // 명령(쓰기) 서비스 주입

    @PostMapping
    @Operation(
            summary = "모임 생성",
            description = "새로운 모임을 생성합니다.",
            security = @SecurityRequirement(name = "Json Web Token(JWT)")
    )
    public ApiResponse<CreateRoomResponse> createRoom(@Valid @RequestBody CreateRoomRequest request, @AuthUser Long userId) {
        CreateRoomResponse createRoomResponse = createRoomCommandService.createRoom(request, userId);
        return ApiResponse.onSuccess(createRoomResponse);
    }

    @GetMapping
    @Operation(summary = "내 모임 조회", description = "내 모임을 조회합니다.", security = @SecurityRequirement(name = "Json Web Token(JWT)"))
    public void getRoom() {

    }
}


