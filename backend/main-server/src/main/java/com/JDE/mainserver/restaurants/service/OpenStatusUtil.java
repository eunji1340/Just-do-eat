/**
 * restaurants/service/OpenStatusUtil.java
 * 현재 영업 여부 계산 유틸
 * Author: Jang
 * Date: 2025-11-03
 */

package com.JDE.mainserver.restaurants.service;

import com.JDE.mainserver.restaurants.entity.Restaurant;
import com.JDE.mainserver.restaurants.entity.RestaurantHour;

import java.time.*;
import java.util.List;
import java.util.Optional;

public final class OpenStatusUtil {

	private OpenStatusUtil() {}

	/**
	 * 현재 영업 상태 계산
	 * @param hours  요일별 영업시간 목록 (null/empty면 UNKNOWN)
	 * @param zoneId 기준 타임존 (예: Asia/Seoul)
	 * @return OPEN / CLOSED / BREAK / UNKNOWN
	 */
	public static Restaurant.OpenStatus calcStatus(List<RestaurantHour> hours, ZoneId zoneId) {
		if (hours == null || hours.isEmpty()) return Restaurant.OpenStatus.UNKNOWN;

		// 현재 시각(타임존 반영) 및 요일 계산: 1=월 ... 7=일
		ZonedDateTime now = ZonedDateTime.now(zoneId);
		int dow = now.getDayOfWeek().getValue();
		int yesterdayDow = now.minusDays(1).getDayOfWeek().getValue();

		// 오늘/어제 후보 탐색 (심야영업 고려 위해 어제 레코드도 확인)
		Optional<RestaurantHour> todayOpt = hours.stream()
			.filter(h -> h.getDow() != null && h.getDow() == dow)
			.findFirst();

		Optional<RestaurantHour> yesterdayOpt = hours.stream()
			.filter(h -> h.getDow() != null && h.getDow() == yesterdayDow)
			.findFirst();

		LocalTime nowTime = now.toLocalTime();

		// 1) 오늘 스케줄 기준 판단
		if (todayOpt.isPresent()) {
			RestaurantHour h = todayOpt.get();
			if (Boolean.TRUE.equals(h.getIsHoliday())) return Restaurant.OpenStatus.CLOSED;

			if (isOpenNow(nowTime, h.getOpen(), h.getClose())) {
				// 오픈 중이지만 브레이크타임이면 BREAK 우선
				if (inBreak(nowTime, h.getBreakOpen(), h.getBreakClose())) {
					return Restaurant.OpenStatus.BREAK;
				}
				return Restaurant.OpenStatus.OPEN;
			}
		}

		// 2) 어제에서 넘어오는 심야영업 처리 (close < open)
		//    예: 어제 18:00 ~ 02:00, 오늘 01:00에는 OPEN으로 봄
		if (yesterdayOpt.isPresent()) {
			RestaurantHour yh = yesterdayOpt.get();
			if (yh.getOpen() != null && yh.getClose() != null && yh.getClose().isBefore(yh.getOpen())) {
				// 오늘 00:00 ~ 어제 close 사이면 어제 영업이 이어지는 중
				if (nowTime.isBefore(yh.getClose())) {
					// 자정 넘는 브레이크는 실무상 드물어 단순 OPEN 처리
					return Restaurant.OpenStatus.OPEN;
				}
			}
		}

		return Restaurant.OpenStatus.CLOSED;
	}

	/**
	 * now가 [open, close) 구간에 포함되는지 판정
	 * - 일반: open <= now < close
	 * - 심야: close < open 이면 (now >= open) || (now < close)
	 */
	private static boolean isOpenNow(LocalTime now, LocalTime open, LocalTime close) {
		if (open == null || close == null) return false;

		if (!close.isBefore(open)) { // 일반 케이스: close >= open
			return !now.isBefore(open) && now.isBefore(close);
		} else { // 심야 케이스: 예) 18:00 ~ 02:00
			return !now.isBefore(open) || now.isBefore(close);
		}
	}

	/**
	 * now가 [bOpen, bClose) 브레이크 구간에 포함되는지 판정
	 * - 일반: bOpen <= now < bClose
	 * - (희귀) 심야 브레이크: bClose < bOpen 이면 (now >= bOpen) || (now < bClose)
	 */
	private static boolean inBreak(LocalTime now, LocalTime bOpen, LocalTime bClose) {
		if (bOpen == null || bClose == null) return false;

		if (!bClose.isBefore(bOpen)) { // 일반 케이스
			return !now.isBefore(bOpen) && now.isBefore(bClose);
		} else { // 자정 넘김
			return !now.isBefore(bOpen) || now.isBefore(bClose);
		}
	}
}
