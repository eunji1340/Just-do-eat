package com.jde.mainserver.main.service.query;

import com.jde.mainserver.main.web.dto.response.MainRegionRecommendResponse;
import com.jde.mainserver.member.dto.response.MemberRegionResponse;
import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class MainRegionRecommendQueryServiceImpl implements MainRegionRecommendQueryService {

    private final MemberRepository memberRepository;

    @Override
    @Transactional(readOnly = true)
    public MainRegionRecommendResponse overview(Long memberId) {
        Member m = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("member not found"));
        if (m.getRegion() == null) {
            return new MainRegionRecommendResponse(false, null, Collections.emptyList());
        }
        return new MainRegionRecommendResponse(
                true,
                MemberRegionResponse.of(m.getRegion()),
                Collections.emptyList()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public MainRegionRecommendResponse recommendations(Long memberId) {
        // TODO: A안(FK) 또는 B안(ST_DWithin 반경검색)으로 추천 목록 채우기
        return overview(memberId); // 일단 개요와 동일하게 반환
    }
}
