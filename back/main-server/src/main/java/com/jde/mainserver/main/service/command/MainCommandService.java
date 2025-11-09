/**
 * main/service/command/MainCommandService.java
 * 메인 Command 서비스 인터페이스
 * Author: Jang
 * Date: 2025-11-04
 */

package com.jde.mainserver.main.service.command;

import com.jde.mainserver.main.web.dto.request.SwipeRequest;
import com.jde.mainserver.main.web.dto.response.SwipeResponse;

public interface MainCommandService {
	/**
	 * 스와이프 액션을 처리합니다.
	 *
	 * 이벤트 저장, 상태 업데이트, 태그 선호도 업데이트를 수행합니다.
	 *
	 * @param request 스와이프 액션 요청 DTO (userId, restaurantId, action)
	 * @return 처리 결과 및 최신 상태 스냅샷을 담은 응답 DTO
	 * @throws com.jde.mainserver.main.exception.MainException 식당을 찾을 수 없는 경우
	 */
	SwipeResponse handleSwipe(SwipeRequest request);
}

