// ProfileImageFileController.java
package com.jde.mainserver.files.web;

import com.jde.mainserver.files.dto.request.ProfilePresignRequest;
import com.jde.mainserver.files.dto.response.ProfilePresignResponse;
import com.jde.mainserver.files.service.ProfileImageFileService;
import com.jde.mainserver.global.annotation.AuthUser;
import com.jde.mainserver.global.api.ApiResponse;
import com.jde.mainserver.global.exception.code.GeneralSuccessCode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/files/profile")
public class ProfileImageFileController {

    private final ProfileImageFileService profileImageFileService;

    @Operation(
            summary = "프로필 이미지 업로드용 presigned URL 발급",
            description = """
            프로필 이미지를 업로드하기 위한 S3 presigned URL을 발급합니다.
            1) 이 엔드포인트로 uploadUrl/publicUrl을 받고
            2) FE가 uploadUrl로 PUT 업로드한 뒤
            3) PATCH /users/me/image 에 publicUrl을 imageUrl로 저장하면 됩니다.
            """,
            security = @SecurityRequirement(name = "Json Web Token(JWT)")
    )
    @PostMapping("/presign")
    public ApiResponse<ProfilePresignResponse> presign(
            @AuthUser Long userId,
            @RequestBody @Valid ProfilePresignRequest req
    ) {
        ProfilePresignResponse res =
                profileImageFileService.createPresignedUrl(userId, req.fileName(), req.contentType());
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, res);
    }
}
