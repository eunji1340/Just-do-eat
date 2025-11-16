package com.jde.mainserver.room.web.controller;

import com.jde.mainserver.global.annotation.AuthUser;
import com.jde.mainserver.global.api.ApiResponse;
import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.room.service.command.CreateInviteLinkCommandService;
import com.jde.mainserver.room.service.command.CreateRoomCommandService;
import com.jde.mainserver.room.service.command.JoinRoomCommandService;
import com.jde.mainserver.room.service.query.GetMyRoomQueryService;
import com.jde.mainserver.room.service.query.RoomDetailQueryService;
import com.jde.mainserver.room.web.dto.request.CreateRoomRequest;
import com.jde.mainserver.room.web.dto.response.*;
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
@SecurityRequirement(name = "Json Web Token(JWT)")
public class RoomController {

    private final CreateRoomCommandService createRoomCommandService; // 명령(쓰기) 서비스 주입
    private final GetMyRoomQueryService getMyRoomQueryService;
    private final RoomDetailQueryService roomDetailQueryService;
    private final CreateInviteLinkCommandService createInviteLinkCommandService;
    private final JoinRoomCommandService joinRoomCommandService;

    @PostMapping
    @Operation(summary = "모임 생성", description = "새로운 모임을 생성합니다.")
    public ApiResponse<CreateRoomResponse> createRoom(@Valid @RequestBody CreateRoomRequest request, @AuthUser Long userId) {
        CreateRoomResponse createRoomResponse = createRoomCommandService.createRoom(request, userId);
        return ApiResponse.onSuccess(createRoomResponse);
    }

    @GetMapping
    @Operation(summary = "내 모임 조회", description = "내 모임을 조회합니다.")
    public ApiResponse<GetMyRoomResponse> getRoom(@AuthUser Member user) {
        GetMyRoomResponse getMyRoomResponse = getMyRoomQueryService.getMyRoom(user);
        return ApiResponse.onSuccess(getMyRoomResponse);
    }

    @GetMapping("/{roomId}")
    @Operation(summary = "모임 상세 조회", description = " 특정 모임에 대한 상세 정보를 조회합니다.")
    public ApiResponse<RoomDetailResponse> roomDetail(@AuthUser Member user, @PathVariable Long roomId) {
        RoomDetailResponse roomDetailResponse = roomDetailQueryService.roomDetail(user, roomId);
        return ApiResponse.onSuccess(roomDetailResponse);
    }

    @PostMapping("/{roomId}/invite")
    @Operation(summary = "모임 초대 링크 생성", description = "특정 모임에 대한 초대 링크를 생성합니다.")
    public ApiResponse<CreateInviteLinkResponse> createInviteLink(@AuthUser Member user, @PathVariable Long roomId){
        CreateInviteLinkResponse inviteLinkResponse = createInviteLinkCommandService.createInvite(user, roomId);
        return ApiResponse.onSuccess(inviteLinkResponse);
    }

    @PostMapping("/join")
    @Operation(summary = "초대 링크를 통해서 모임 가입", description = "특정 모임에 초대 링크를 통해서 모임 가입")
    public ApiResponse<JoinRoomResponse> joinRoom(@RequestParam String token, @AuthUser Member user) {
        JoinRoomResponse joinRoomResponse = joinRoomCommandService.joinRoom(token, user);
        return ApiResponse.onSuccess(joinRoomResponse);
    }
}


