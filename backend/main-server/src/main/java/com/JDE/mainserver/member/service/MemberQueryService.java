package com.JDE.mainserver.member.service;

import com.JDE.mainserver.global.exception.CustomException;
import com.JDE.mainserver.member.entity.Member;
import com.JDE.mainserver.member.repository.MemberRepository;
import com.JDE.mainserver.member.dto.response.MemberInfoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.JDE.mainserver.global.exception.code.MemberErrorCode.MEMBER_NOT_FOUND;

@Service
@RequiredArgsConstructor
public class MemberQueryService {

    private final MemberRepository memberRepository;

    @Transactional(readOnly = true)
    public boolean existsUserId(String userId) {
        return memberRepository.existsByUserId(userId);
    }

    @Transactional(readOnly = true)
    public MemberInfoResponse getMe(Long memberId) {
        Member m = memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MEMBER_NOT_FOUND));
        return MemberInfoResponse.from(m);
    }
}
