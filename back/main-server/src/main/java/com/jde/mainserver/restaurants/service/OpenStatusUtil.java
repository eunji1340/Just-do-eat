/**
 * restaurants/service/OpenStatusUtil.java
 * 현재 영업 여부 계산 유틸
 * Author: Jang
 * Date: 2025-11-03
 */
package com.jde.mainserver.restaurants.service;

import com.jde.mainserver.restaurants.entity.RestaurantHour;
import com.jde.mainserver.restaurants.entity.enums.OpenStatus;

import java.time.*;
import java.util.List;
import java.util.Optional;

public final class OpenStatusUtil {
	private OpenStatusUtil() {
	}

	/**
	 * 현재 영업 상태 계산
	 *
	 * 규칙 요약:
	 * 1) hours 없으면 UNKNOWN
	 * 2) 오늘 요일의 영업정보를 기준으로 OPEN/BREAK/CLOSED 판정
	 *		- isHoliday == treu 이면 무조건 CLOSED
	 *		- [open, close) 범위 안이면 OPEN (단, 브레이크 시간이면 BREAK)
	 * 3) 만약 오늘 기준으로도 아니면,
	 * 	  "어제 시작해서 오늘 새벽까지 이어지는 영업(자정 넘김)" 여부를 확인
	 *		- 예: 금 18:00 ~ 토 02:00 이고, 지금이 토 01:00 이면 OPEN
	 * 4) 위에 다 해당 안 되면 CLOSED
	 *
	 * @param hours 식당의 요일별 영업시간 목록
	 * @param zoneId 기준 타임존 (ex. ZoneId.of("Asia/Seoul"))
	 */
	public static OpenStatus calcStatus(List<RestaurantHour> hours, ZoneId zoneId) {
		return calcStatusAt(hours, zoneId, ZonedDateTime.now(zoneId));
	}

	/**
	 * 특정 시각 기준 영업 상태 계산
	 *
	 * @param hours 식당의 요일별 영업시간 목록
	 * @param zoneId 기준 타임존 (ex. ZoneId.of("Asia/Seoul"))
	 * @param targetTime 계산 기준 시각
	 */
	public static OpenStatus calcStatusAt(List<RestaurantHour> hours, ZoneId zoneId, ZonedDateTime targetTime) {
		// 영업 시간 정보 없음 -> UNKNOWN
		if (hours == null || hours.isEmpty())
			return OpenStatus.UNKNOWN;

		// 기준 시각 (해당 타임존 기준)
		ZonedDateTime now = targetTime.withZoneSameInstant(zoneId);

		// 오늘 요일 (1=월 ... 7=일)
		int dow = now.getDayOfWeek().getValue();

		// 어제 요일 (자정 넘는 영업 처리)
		int yesterdayDow = now.minusDays(1).getDayOfWeek().getValue();

		// 공휴일 영업시간 (dow=0)
		Optional<RestaurantHour> holidayOpt = hours.stream()
			.filter(h -> h.getDow() != null && h.getDow() == 0)
			.findFirst();

		// 오늘 요일의 영업시간 1건
		Optional<RestaurantHour> todayOpt = hours.stream()
			.filter(h -> h.getDow() != null && h.getDow() == dow)
			.findFirst();

		// 어제 요일의 영업시간 1건
		Optional<RestaurantHour> yesterdayOpt = hours.stream()
			.filter(h -> h.getDow() != null && h.getDow() == yesterdayDow)
			.findFirst();

		// 현재 시간의 "시간" 부분만
		LocalTime nowTime = now.toLocalTime();

		// 0. 공휴일 체크 (공휴일이면 공휴일 스케줄 우선 적용)
		// TODO: 실제 공휴일 여부 확인 로직 추가 필요 (현재는 공휴일 스케줄이 있으면 사용)
		if (holidayOpt.isPresent()) {
			RestaurantHour h = holidayOpt.get();
			// 공휴일 스케줄이 있고, 영업시간 안이면 OPEN
			if (isOpenNow(nowTime, h.getOpen(), h.getClose())) {
				if (isBreak(nowTime, h.getBreakOpen(), h.getBreakClose())) {
					return OpenStatus.BREAK;
				}
				return OpenStatus.OPEN;
			}
		}

		// 1. 오늘 스케줄 기준 판정
		if (todayOpt.isPresent()) {
			RestaurantHour h = todayOpt.get();

			// isHoliday == true -> CLOSED (해당 요일이 휴무인 경우)
			if (Boolean.TRUE.equals(h.getIsHoliday()))
				return OpenStatus.CLOSED;

			// 지금 시간이 오늘의 영업시간 구간 안에 들어가는지
			if (isOpenNow(nowTime, h.getOpen(), h.getClose())) {

				// 브레이크 타임이면 BREAK
				if (isBreak(nowTime, h.getBreakOpen(), h.getBreakClose())) {
					return OpenStatus.BREAK;
				}
				
				return OpenStatus.OPEN;
			}
		}
		
		// 2. 어제에서 이어지는 심야 영업 처리
		if (yesterdayOpt.isPresent()) {
			RestaurantHour yh = yesterdayOpt.get();

			// close < open 이면 심야 영업
			if (yh.getOpen() != null && yh.getClose() != null && yh.getClose().isBefore(yh.getOpen())) {

				// 현재 시간이 어제 close 이전이면 OPEN
				if (nowTime.isBefore(yh.getClose())) {
					return OpenStatus.OPEN;
				}
			}
		}

		// 위 모든 경우가 아니면 CLOSED
		return OpenStatus.CLOSED;
	}

	// now가 영업시간 구간 안에 있는지 확인
	private static boolean isOpenNow(LocalTime now, LocalTime open, LocalTime close) {
		if (open == null || close == null)
			return false;
		if (!close.isBefore(open)) {    // 일반 (open <= close)
			return !now.isBefore(open) && now.isBefore(close);
		} else {                        // 심야 (close < open)
			return !now.isBefore(open) || now.isBefore(close);
		}
	}

	// now가 브레이크타임 구간 안에 있는지 확인
	private static boolean isBreak(LocalTime now, LocalTime bOpen, LocalTime bClose) {
		if (bOpen == null || bClose == null)
			return false;
		if (!bClose.isBefore(bOpen)) {
			return !now.isBefore(bOpen) && now.isBefore(bClose);
		} else {
			return !now.isBefore(bOpen) || now.isBefore(bClose);
		}
	}
}