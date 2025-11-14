package com.jde.mainserver.onboarding.bingo.service;

import com.jde.mainserver.onboarding.bingo.dto.BingoItem;
import com.jde.mainserver.onboarding.bingo.dto.BingoItemsResponse;
import com.jde.mainserver.onboarding.bingo.repository.BingoMenuMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BingoQueryService {

	private final BingoMenuMasterRepository bingoMenuMasterRepository;

	public BingoItemsResponse getItems() {
		var items = bingoMenuMasterRepository.findAllByOrderByDisplayOrderAsc()
				.stream()
				.map(e -> new BingoItem(e.getId(), e.getLabel()))
				.toList();
		return new BingoItemsResponse(items);
	}
}


