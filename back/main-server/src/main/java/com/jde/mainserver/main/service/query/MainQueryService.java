/**
 * main/service/query/MainQueryService.java
 * 메인 Query 서비스 인터페이스
 * Author: Jang
 * Date: 2025-11-04
 */

package com.jde.mainserver.main.service.query;

import com.jde.mainserver.main.web.dto.response.FeedResponse;
import com.jde.mainserver.main.web.dto.response.PersonalScoreResponse;

import java.util.Map;

public interface MainQueryService {

	/**
	 * 개인 추천 피드를 조회합니다.
	 *
	 * cursor 기반 무한 스크롤 방식으로 피드를 제공합니다.
	 * 비회원(userId가 null)도 접근 가능하며, 카카오 평점/리뷰 수 기준으로 정렬됩니다.
	 *
	 * @param userId 사용자 ID (null이면 비회원)
	 * @param cursor 다음 배치 요청을 위한 커서 (null이면 첫 요청)
	 * @param ctx 컨텍스트 정보 (위치, 반경 등)
	 * @return 피드 응답 DTO (식당 리스트 및 다음 커서)
	 */
	FeedResponse getFeedBatch(Long userId, String cursor, Map<String, Object> ctx);

	/**
	 * 개인화 점수 계산 결과를 조회합니다.
	 *
	 * 사용자 태그 선호도와 후보 식당을 기반으로 개인화 점수를 계산합니다.
	 *
	 * @param userId 사용자 ID
	 * @param top 상위 N개 식당 반환
	 * @param debug 디버그 정보 포함 여부
	 * @param ctx 컨텍스트 정보 (위치, 반경 등)
	 * @return 점수 계산 결과를 담은 응답 DTO
	 */
	PersonalScoreResponse getPersonalFeed(long userId, int top, boolean debug, Map<String, Object> ctx);

	/**
	 * 최근 선택한 식당을 조회합니다.
	 *
	 * 사용자가 가장 최근에 SELECT 액션으로 선택한 식당을 조회합니다.
	 *
	 * @param userId 사용자 ID
	 * @return 최근 선택한 식당 정보 (없으면 null)
	 */
	com.jde.mainserver.main.web.dto.response.LastSelectedRestaurantResponse getLastSelectedRestaurant(Long userId);

	/**
	 * 사용자 위치 좌표 조회 (경도, 위도)
	 *
	 * @param userId 사용자 ID (null이면 기본 지역 사용)
	 * @return [경도, 위도]
	 */
	double[] getCoordinates(Long userId);
}

