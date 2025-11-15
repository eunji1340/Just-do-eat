package com.jde.mainserver.onboarding.service;

import com.jde.mainserver.onboarding.dto.OnboardingTypeMatch;
import com.jde.mainserver.onboarding.dto.OnboardingTypeResult;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * 온보딩 타입 결과 조회 서비스.
 * - 별도 DB 없이 애플리케이션 메모리에 정적 맵으로 보관합니다.
 * - 이미지 경로는 정적 리소스(/static/mbtis) 기준으로 '/mbtis/{code}.png' 를 사용합니다.
 */
@Service
public class OnboardingTypeQueryService {

	private final Map<String, OnboardingTypeResult> codeToResult = new HashMap<>();

	public OnboardingTypeQueryService() {
		// MPST
		codeToResult.put("MPST", new OnboardingTypeResult(
				"MPST",
				"현실파 점심헌터",
				"현실파 점심헌터",
				List.of("가성비", "한정식", "빨리먹고간다"),
				"식사를 연료처럼 생각하며 익숙하고 빠르게 먹을 수 있는 메뉴를 선호합니다.",
				List.of(new OnboardingTypeMatch("NPSD", "현실형 실속러", image("/mbtis/NPSD.png"))),
				List.of(new OnboardingTypeMatch("MQAD", "느긋한 탐미가", image("/mbtis/MQAD.png"))),
				image("/mbtis/MPST.png")
		));

		// MPSD
		codeToResult.put("MPSD", new OnboardingTypeResult(
				"MPSD",
				"실속형 루틴러",
				"실속형 루틴러",
				List.of("가성비", "일상식사", "분식집단골"),
				"일상 속 익숙함과 합리적인 가격 대비 만족을 중시합니다.",
				List.of(new OnboardingTypeMatch("NPST", "루틴형 직장인", image("/mbtis/NPST.png"))),
				List.of(new OnboardingTypeMatch("MQAD", "느긋한 탐미가", image("/mbtis/MQAD.png"))),
				image("/mbtis/MPSD.png")
		));

		// MPAT
		codeToResult.put("MPAT", new OnboardingTypeResult(
				"MPAT",
				"즉흥적 푸드러버",
				"즉흥적 푸드러버",
				List.of("길거리음식", "야시장", "새로운조합"),
				"즉흥적인 모험을 즐기며 새로운 맛 발견에 적극적입니다.",
				List.of(new OnboardingTypeMatch("NQAD", "감성형 미식탐험가", image("/mbtis/NQAD.png"))),
				List.of(new OnboardingTypeMatch("NQST", "완벽주의 미식가", image("/mbtis/NQST.png"))),
				image("/mbtis/MPAT.png")
		));

		// MPAD
		codeToResult.put("MPAD", new OnboardingTypeResult(
				"MPAD",
				"감성형 탐식가",
				"감성형 탐식가",
				List.of("감성식당", "야시장", "카메라먼저"),
				"분위기와 맛을 함께 즐기며 감각적인 경험을 추구합니다.",
				List.of(new OnboardingTypeMatch("MQAD", "느긋한 탐미가", image("/mbtis/MQAD.png"))),
				List.of(new OnboardingTypeMatch("NQST", "완벽주의 미식가", image("/mbtis/NQST.png"))),
				image("/mbtis/MPAD.png")
		));

		// MQST
		codeToResult.put("MQST", new OnboardingTypeResult(
				"MQST",
				"평온한 루틴러",
				"평온한 루틴러",
				List.of("고급분식", "일상식사", "조용한카페"),
				"안정성과 잔잔한 분위기를 선호하며 과한 모험은 피합니다.",
				List.of(new OnboardingTypeMatch("NQSD", "꼼꼼한 루틴러", image("/mbtis/NQSD.png"))),
				List.of(new OnboardingTypeMatch("MPAD", "감성형 탐식가", image("/mbtis/MPAD.png"))),
				image("/mbtis/MQST.png")
		));

		// MQSD
		codeToResult.put("MQSD", new OnboardingTypeResult(
				"MQSD",
				"고급 실속파",
				"고급 실속파",
				List.of("가심비", "조용한카페", "안정적"),
				"안정적인 선택 안에서도 세심한 디테일과 품질을 챙깁니다.",
				List.of(new OnboardingTypeMatch("NQST", "완벽주의 미식가", image("/mbtis/NQST.png"))),
				List.of(new OnboardingTypeMatch("MPAT", "즉흥적 푸드러버", image("/mbtis/MPAT.png"))),
				image("/mbtis/MQSD.png")
		));

		// MQAT
		codeToResult.put("MQAT", new OnboardingTypeResult(
				"MQAT",
				"기획형 미식가",
				"기획형 미식가",
				List.of("고급한끼", "가심비", "예약필수"),
				"철저한 조사 후 완성도 높은 한 끼를 추구하는 계획형 미식가입니다.",
				List.of(new OnboardingTypeMatch("NQAD", "감성형 미식탐험가", image("/mbtis/NQAD.png"))),
				List.of(new OnboardingTypeMatch("MPST", "현실파 점심헌터", image("/mbtis/MPST.png"))),
				image("/mbtis/MQAT.png")
		));

		// MQAD
		codeToResult.put("MQAD", new OnboardingTypeResult(
				"MQAD",
				"느긋한 탐미가",
				"느긋한 탐미가",
				List.of("분위기맛집", "식사도여행", "와인페어링"),
				"여유로운 식사와 깊이 있는 대화를 즐기며 음식 자체를 경험으로 여깁니다.",
				List.of(new OnboardingTypeMatch("MPAD", "감성형 탐식가", image("/mbtis/MPAD.png"))),
				List.of(new OnboardingTypeMatch("NPST", "루틴형 직장인", image("/mbtis/NPST.png"))),
				image("/mbtis/MQAD.png")
		));

		// NPST
		codeToResult.put("NPST", new OnboardingTypeResult(
				"NPST",
				"루틴형 직장인",
				"루틴형 직장인",
				List.of("한식정식", "가성비", "점심30분"),
				"효율과 속도를 중시하며 새로운 메뉴는 부담스럽습니다.",
				List.of(new OnboardingTypeMatch("MPST", "현실파 점심헌터", image("/mbtis/MPST.png"))),
				List.of(new OnboardingTypeMatch("MQAD", "느긋한 탐미가", image("/mbtis/MQAD.png"))),
				image("/mbtis/NPST.png")
		));

		// NPSD
		codeToResult.put("NPSD", new OnboardingTypeResult(
				"NPSD",
				"현실형 실속러",
				"현실형 실속러",
				List.of("가성비", "무난한메뉴", "점심정식"),
				"효율적이면서도 실패 없는 무난한 만족을 추구합니다.",
				List.of(new OnboardingTypeMatch("MPST", "현실파 점심헌터", image("/mbtis/MPST.png"))),
				List.of(new OnboardingTypeMatch("MQAD", "느긋한 탐미가", image("/mbtis/MQAD.png"))),
				image("/mbtis/NPSD.png")
		));

		// NPAT
		codeToResult.put("NPAT", new OnboardingTypeResult(
				"NPAT",
				"열정적 플랜러",
				"열정적 플랜러",
				List.of("프로맛집러", "계획형", "시간관리"),
				"신메뉴를 고를 때도 철저히 조사하여 실패 없는 선택을 합니다.",
				List.of(new OnboardingTypeMatch("MQAT", "기획형 미식가", image("/mbtis/MQAT.png"))),
				List.of(new OnboardingTypeMatch("MPST", "현실파 점심헌터", image("/mbtis/MPST.png"))),
				image("/mbtis/NPAT.png")
		));

		// NPAD
		codeToResult.put("NPAD", new OnboardingTypeResult(
				"NPAD",
				"느긋한 생활미식가",
				"느긋한 생활미식가",
				List.of("브런치카페", "산책후식사", "일상힐링"),
				"맛집 탐방 자체를 힐링으로 느끼며 여유로운 식사를 즐깁니다.",
				List.of(new OnboardingTypeMatch("MQAD", "느긋한 탐미가", image("/mbtis/MQAD.png"))),
				List.of(new OnboardingTypeMatch("NPST", "루틴형 직장인", image("/mbtis/NPST.png"))),
				image("/mbtis/NPAD.png")
		));

		// NQST
		codeToResult.put("NQST", new OnboardingTypeResult(
				"NQST",
				"완벽주의 미식가",
				"완벽주의 미식가",
				List.of("정갈한한식", "프리미엄", "디테일"),
				"위생·서비스·맛 모든 요소의 완성도를 기준으로 평가합니다.",
				List.of(new OnboardingTypeMatch("MQSD", "고급 실속파", image("/mbtis/MQSD.png"))),
				List.of(new OnboardingTypeMatch("MPAT", "즉흥적 푸드러버", image("/mbtis/MPAT.png"))),
				image("/mbtis/NQST.png")
		));

		// NQSD
		codeToResult.put("NQSD", new OnboardingTypeResult(
				"NQSD",
				"꼼꼼한 루틴러",
				"꼼꼼한 루틴러",
				List.of("고급분식", "디테일", "안정지향"),
				"안정 속에서도 균형 잡힌 품질과 디테일을 놓치지 않습니다.",
				List.of(new OnboardingTypeMatch("MQST", "평온한 루틴러", image("/mbtis/MQST.png"))),
				List.of(new OnboardingTypeMatch("MPAD", "감성형 탐식가", image("/mbtis/MPAD.png"))),
				image("/mbtis/NQSD.png")
		));

		// NQAT
		codeToResult.put("NQAT", new OnboardingTypeResult(
				"NQAT",
				"고급탐험가",
				"고급탐험가",
				List.of("예약맛집", "특별한경험", "한정메뉴"),
				"시간과 비용을 투자해도 특별한 경험을 추구하는 고급 취향의 탐험가입니다.",
				List.of(new OnboardingTypeMatch("MQAT", "기획형 미식가", image("/mbtis/MQAT.png"))),
				List.of(new OnboardingTypeMatch("MPST", "현실파 점심헌터", image("/mbtis/MPST.png"))),
				image("/mbtis/NQAT.png")
		));

		// NQAD
		codeToResult.put("NQAD", new OnboardingTypeResult(
				"NQAD",
				"감성형 미식탐험가",
				"감성형 미식탐험가",
				List.of("분위기", "느긋한식사", "새로움"),
				"분위기·맛·새로움 모두를 즐기며 한 끼를 특별한 체험으로 만듭니다.",
				List.of(new OnboardingTypeMatch("MQAD", "느긋한 탐미가", image("/mbtis/MQAD.png"))),
				List.of(new OnboardingTypeMatch("MPST", "현실파 점심헌터", image("/mbtis/MPST.png"))),
				image("/mbtis/NQAD.png")
		));
	}

	/**
	 * 타입 코드로 결과 조회(대소문자 무시).
	 * 존재하지 않으면 Optional.empty() 반환.
	 */
	public Optional<OnboardingTypeResult> getByCode(String code) {
		if (code == null) return Optional.empty();
		String normalized = code.toUpperCase(Locale.ROOT).trim();
		return Optional.ofNullable(codeToResult.get(normalized));
	}

	private static String image(String path) {
		// 경로 안정성 보장을 위해 항상 '/' 로 시작시키기
		return path.startsWith("/") ? path : "/" + path;
	}
}


