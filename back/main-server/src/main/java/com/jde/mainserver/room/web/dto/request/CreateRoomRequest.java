package com.jde.mainserver.room.web.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Schema(description = "모임 생성 요청 DTO") // DTO 전체에 대한 설명
public class CreateRoomRequest {

    @NotBlank
    @Size(max = 10)
    @Schema(description =  "모임 이름", example = "A701") // 필드에 대한 설명과 예시
    private String roomName;
}
