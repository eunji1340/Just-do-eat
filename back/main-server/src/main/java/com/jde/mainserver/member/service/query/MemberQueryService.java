package com.jde.mainserver.member.service.query;

import com.jde.mainserver.files.service.ProfileImageFileService;
import com.jde.mainserver.global.exception.CustomException;
import com.jde.mainserver.member.dto.response.MemberInfoResponse;
import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.jde.mainserver.global.exception.code.MemberErrorCode.MEMBER_NOT_FOUND;

@Service
@RequiredArgsConstructor
public class MemberQueryService {

    private final MemberRepository memberRepository;
    private final ProfileImageFileService profileImageFileService;

    /**
     * 로그인용 아이디(name) 중복 확인
     */
    @Transactional(readOnly = true)
    public boolean existsName(String name) {
        return memberRepository.existsByName(name);
    }

    /**
     * 내 정보 조회 (/users/me)
     * - DB에 저장된 imageUrl(키 or 전체 URL)을 기반으로 presigned GET URL 생성
     */
    @Transactional(readOnly = true)
    public MemberInfoResponse getMe(Long memberId) {
        Member m = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MEMBER_NOT_FOUND));

        String signedImageUrl = profileImageFileService.generatePresignedGetUrl(m.getImageUrl());
        System.out.println("[MemberQueryService] signedImageUrl in getMe -> " + signedImageUrl);

        return MemberInfoResponse.from(m, signedImageUrl);
    }
}
