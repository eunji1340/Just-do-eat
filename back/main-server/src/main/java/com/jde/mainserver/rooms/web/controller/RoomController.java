package com.jde.mainserver.rooms.web.controller;

import com.jde.mainserver.global.annotation.AuthUser;
import com.jde.mainserver.global.api.ApiResponse;
import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.global.api.ApiResponse;
import com.jde.mainserver.rooms.service.command.CreateRoomCommandService;
import com.jde.mainserver.rooms.web.dto.request.CreateRoomRequest;
import com.jde.mainserver.rooms.web.dto.response.CreateRoomResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController // 이 클래스가 REST API를 처리하는 컨트롤러임을 명시
@RequestMapping("/rooms")
@RequiredArgsConstructor // final 필드에 대한 생성자를 자동으로 생성
@Tag(name = "Room", description = "모임 관련 API") // Swagger/OpenAPI 문서화를 위한 태그
public class RoomController {

    private final CreateRoomCommandService createRoomCommandService; // 명령(쓰기) 서비스 주입

//
//    @PostMapping
//    @Operation(summary = "모임 생성", description = "새로운 모임을 생성합니다.")
//    public ApiResponse<CreateRoomResponse> createRoom(@Valid @RequestBody CreateRoomRequest request, @AuthUser Member user) {
//        CreateRoomResponse response = createRoomCommandService.createRoom(request, user);
//
//        return ApiResponse<response>;
//    }

}
