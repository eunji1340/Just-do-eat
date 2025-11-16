package com.jde.mainserver.member.service.command;
import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.member.entity.enums.AgeGroup;
import com.jde.mainserver.member.entity.enums.Gender;
import com.jde.mainserver.member.entity.enums.Role;
import com.jde.mainserver.member.repository.MemberRepository;
import com.jde.mainserver.onboarding.OnboardingSurveyStore;
import com.jde.mainserver.onboarding.service.OnboardingTagPrefInitializer;
import com.jde.mainserver.region.entity.Region;
import com.jde.mainserver.region.repository.RegionRepository;
import com.jde.mainserver.global.security.jwt.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.stubbing.Answer;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * 회원가입 시 세션 이관 및 온보딩 기반 태그 초기화가 수행되는지 검증.
 */
class AuthCommandServiceTest {

	private MemberRepository memberRepository;
	private PasswordEncoder passwordEncoder;
	private JwtUtil jwtUtil;
	private OnboardingSurveyStore onboardingSurveyStore;
	private RegionRepository regionRepository;
	private OnboardingTagPrefInitializer initializer;

	private AuthCommandService sut;

	@BeforeEach
	void setUp() {
		memberRepository = mock(MemberRepository.class);
		passwordEncoder = mock(PasswordEncoder.class);
		jwtUtil = mock(JwtUtil.class);
		onboardingSurveyStore = mock(OnboardingSurveyStore.class);
		regionRepository = mock(RegionRepository.class);
		initializer = mock(OnboardingTagPrefInitializer.class);

		sut = new AuthCommandService(memberRepository, passwordEncoder, jwtUtil, onboardingSurveyStore, initializer, regionRepository);

		when(passwordEncoder.encode(anyString())).thenReturn("ENC");
		Region region = mock(Region.class);
		when(regionRepository.findById(1L)).thenReturn(Optional.of(region));
		when(memberRepository.existsByName(anyString())).thenReturn(false);

		// save가 호출될 때, userId를 채워 반환하도록 스텁
		when(memberRepository.save(any(Member.class))).thenAnswer((Answer<Member>) inv -> {
			Member m = inv.getArgument(0);
			// 리플렉션으로 userId 주입
			try {
				var f = Member.class.getDeclaredField("userId");
				f.setAccessible(true);
				f.set(m, 999L);
			} catch (Exception ignored) {}
			return m;
		});
	}

	@Test
	@DisplayName("회원가입 시 세션 이관 후 초기화 서비스 호출")
	void signUp_callsInitializer() {
		// given
		Object req = newSignUpRequest("user1", "pw", null, AgeGroup.TWENTIES, Gender.FEMALE, "sid-abc");

		// when
		invokeSignUp(req);

		// then
		verify(onboardingSurveyStore, times(1)).migrateSessionToUser(eq("sid-abc"), eq(999L));
		verify(initializer, times(1)).applyFromStore(eq(999L), isNull());
	}

	/**
	 * 리플렉션으로 SignUpRequest 인스턴스를 생성한다.
	 * - 테스트 컴파일 의존성을 최소화하기 위함
	 */
	private Object newSignUpRequest(String name, String pw, String imageUrl, AgeGroup ageGroup, Gender gender, String sessionId) {
		try {
			Class<?> clazz = Class.forName("com.jde.mainserver.member.dto.request.SignUpRequest");
			var ctor = clazz.getConstructor(String.class, String.class, String.class, AgeGroup.class, Gender.class, String.class);
			return ctor.newInstance(name, pw, imageUrl, ageGroup, gender, sessionId);
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}

	/**
	 * 리플렉션으로 signUp 메서드를 호출한다.
	 */
	private void invokeSignUp(Object req) {
		try {
			Class<?> reqClazz = Class.forName("com.jde.mainserver.member.dto.request.SignUpRequest");
			var m = AuthCommandService.class.getMethod("signUp", reqClazz);
			m.invoke(sut, req);
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}
}


