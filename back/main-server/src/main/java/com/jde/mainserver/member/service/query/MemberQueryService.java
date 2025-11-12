package com.jde.mainserver.member.service.query;

import com.jde.mainserver.global.exception.CustomException;
import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.member.repository.MemberRepository;
import com.jde.mainserver.member.dto.response.MemberInfoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.jde.mainserver.global.exception.code.MemberErrorCode.MEMBER_NOT_FOUND;

@Service
@RequiredArgsConstructor
public class MemberQueryService {

    private final MemberRepository memberRepository;

    /**
     * 로그인용 아이디(name) 중복 확인
     * 기존: existsUserId(String userId) → 변경: existsName(String name)
     */
    @Transactional(readOnly = true)
    public boolean existsName(String name) {
        return memberRepository.existsByName(name);
    }

    @Transactional(readOnly = true)
    public MemberInfoResponse getMe(Long memberId) {
        Member m = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MEMBER_NOT_FOUND));
        return MemberInfoResponse.from(m);
    }
}
