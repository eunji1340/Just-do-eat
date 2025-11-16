package com.jde.mainserver.onboarding.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jde.mainserver.onboarding.OnboardingSurveyStore;
import com.jde.mainserver.onboarding.mapping.OnboardingTagMapping;
import com.jde.mainserver.onboarding.mapping.OnboardingTagMapping.TagRef;
import com.jde.mainserver.main.repository.UserTagPrefRepository;
import com.jde.mainserver.restaurants.entity.Tag;
import com.jde.mainserver.restaurants.repository.TagRepository;
import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

/**
 * 온보딩 세션 결과를 기반으로 user_tag_pref 초기값을 생성/재생성하는 서비스.
 * - 회원가입 직후 또는 재초기화 시 재사용할 수 있도록 별도 서비스로 분리
 * - 예외 처리는 최소화하고, 데이터 부재/파싱 실패는 조용히 무시(로그만 남김)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OnboardingTagPrefInitializer {

	private final OnboardingSurveyStore store;
	private final TagRepository tagRepository;
	private final UserTagPrefRepository userTagPrefRepository;
	private final ObjectMapper objectMapper;

	/**
	 * 세션/회원 온보딩 데이터를 읽어 user_tag_pref를 생성한다.
	 * - sessionId가 주어지면 세션 데이터를 회원 키로 이관 후 처리한다.
	 * - 기존 user_tag_pref는 모두 삭제 후 새로 채운다(초기화).
	 */
	@Transactional
	public void applyFromStore(Long userId, @Nullable String sessionId) {
		// 세션 → 유저로 이관(있다면)
		if (sessionId != null && !sessionId.isBlank()) {
			try {
				store.migrateSessionToUser(sessionId, userId);
			} catch (Exception e) {
				log.warn("[OnboardingTagPrefInitializer] 세션 이관 실패: sessionId={}, userId={}, err={}", sessionId, userId, e.toString());
				// 이관 실패해도 진행 불가하므로 중단
				return;
			}
		}

		// 유저 기준 온보딩 JSON 로드
		Optional<String> jsonOpt;
		try {
			jsonOpt = store.findByUser(userId);
		} catch (Exception e) {
			log.warn("[OnboardingTagPrefInitializer] 온보딩 저장소 접근 실패: userId={}, err={}", userId, e.toString());
			return;
		}
		if (jsonOpt.isEmpty() || jsonOpt.get().isBlank()) {
			return; // 데이터 없음
		}

		// JSON 파싱
		JsonNode root;
		try {
			root = objectMapper.readTree(jsonOpt.get());
		} catch (Exception e) {
			log.warn("[OnboardingTagPrefInitializer] 온보딩 JSON 파싱 실패: userId={}, err={}", userId, e.toString());
			return;
		}

		// answers.* 노드 접근
		JsonNode answers = root.path("answers");
		if (answers.isMissingNode() || answers.isNull()) {
			return;
		}

		// 1) 축 가중치 수집: answers.mukbtiResult.weights = { "M":1, ... }
		Map<String, Integer> axisWeights = new HashMap<>();
		JsonNode weights = answers.path("mukbtiResult").path("weights");
		if (weights.isObject()) {
			Iterator<String> it = weights.fieldNames();
			while (it.hasNext()) {
				String code = it.next();
				int v = safeInt(weights.get(code), 0);
				axisWeights.put(code, v);
			}
		}

		// 2) 메뉴 투표 수집: answers.bingoResponses = [ {id, vote}, ... ]
		List<MenuVote> menuVotes = new ArrayList<>();
		JsonNode bingo = answers.path("bingoResponses");
		if (bingo.isArray()) {
			for (JsonNode n : bingo) {
				String id = optText(n.path("id"));
				int vote = clamp(safeInt(n.path("vote"), 0), -1, 1);
				if (!id.isBlank() && vote != 0) {
					menuVotes.add(new MenuVote(id, vote));
				}
			}
		}

		// 3) 누적 점수 계산: tagKey = (type,name)
		Map<TagKey, Double> acc = new HashMap<>();

		// 3-1) 축 기여도
		for (Map.Entry<String, Integer> e : axisWeights.entrySet()) {
			String code = e.getKey();
			int raw = e.getValue(); // M/N/P/Q/S/A: 1~3, T/D: 1~5
			if (raw <= 0) continue;

			double norm = switch (code) {
				case "T", "D" -> raw / 5.0;
				default -> raw / 3.0;
			};
			for (TagRef ref : OnboardingTagMapping.getAxis(code)) {
				TagKey key = new TagKey(ref.type(), ref.name());
				double add = norm * ref.weight();
				acc.put(key, acc.getOrDefault(key, 0.0) + add);
			}
		}

		// 3-2) 메뉴 기여도
		for (MenuVote mv : menuVotes) {
			for (TagRef ref : OnboardingTagMapping.getMenu(mv.id())) {
				TagKey key = new TagKey(ref.type(), ref.name());
				double add = mv.vote() * (double) ref.weight();
				acc.put(key, acc.getOrDefault(key, 0.0) + add);
			}
		}

		// 아무 것도 없으면 종료
		if (acc.isEmpty()) {
			return;
		}

		// 4) DB 적용: 기존 값 삭제 후 삽입(upsertIncrement 초기값 사용)
		try {
			userTagPrefRepository.deleteByUserId(userId);
		} catch (Exception e) {
			log.warn("[OnboardingTagPrefInitializer] 기존 선호 삭제 실패: userId={}, err={}", userId, e.toString());
			// 실패 시 더 진행하지 않음
			return;
		}

		// (type,name) → tag_id 조회 캐시
		Map<TagKey, Long> tagIdCache = new HashMap<>();

		for (Map.Entry<TagKey, Double> e : acc.entrySet()) {
			TagKey key = e.getKey();
			double sum = e.getValue();

			// 최종 점수/신뢰도 계산 및 범위 보정
			double clamped = clamp(sum, -3.0, 3.0);
			double conf = Math.min(1.0, Math.abs(clamped) / 3.0);

			// 태그 ID 조회
			Long tagId = resolveTagId(tagIdCache, key);
			if (tagId == null) {
				// 태그가 없으면 건너뜀(MVP: 로깅만)
				log.debug("[OnboardingTagPrefInitializer] 매핑된 태그 미존재로 스킵: type={}, name={}", key.type, key.name);
				continue;
			}

			try {
				userTagPrefRepository.upsertIncrement(
					userId,
					tagId,
					BigDecimal.valueOf(clamped),  // 초기 점수
					BigDecimal.valueOf(conf),     // 초기 신뢰도
					BigDecimal.ZERO,              // 증분 없음
					BigDecimal.ZERO               // 증분 없음
				);
			} catch (Exception ex) {
				log.warn("[OnboardingTagPrefInitializer] upsert 실패: userId={}, tagId={}, err={}", userId, tagId, ex.toString());
			}
		}
	}

	/** (type,name) → tag_id 해석 */
	private Long resolveTagId(Map<TagKey, Long> cache, TagKey key) {
		if (cache.containsKey(key)) return cache.get(key);
		Optional<Tag> tag = tagRepository.findByTypeAndName(key.type, key.name);
		Long id = tag.map(Tag::getId).orElse(null);
		cache.put(key, id);
		return id;
	}

	private static int safeInt(JsonNode n, int def) {
		return (n != null && n.isNumber()) ? n.asInt() : def;
	}
	private static String optText(JsonNode n) {
		return (n != null && !n.isNull()) ? n.asText("") : "";
	}
	private static int clamp(int v, int lo, int hi) {
		return Math.max(lo, Math.min(hi, v));
	}
	private static double clamp(double v, double lo, double hi) {
		return Math.max(lo, Math.min(hi, v));
	}

	/** 메뉴 투표 값 */
	private record MenuVote(String id, int vote) {}
	/** 태그 키 (타입+이름) */
	private record TagKey(Tag.TagType type, String name) {}
}


