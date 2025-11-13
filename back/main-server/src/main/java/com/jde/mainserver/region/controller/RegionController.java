package com.jde.mainserver.region.controller;

import com.jde.mainserver.global.api.ApiResponse;
import com.jde.mainserver.region.repository.RegionRepository;
import com.jde.mainserver.region.web.dto.response.RegionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/regions")
public class RegionController {

    private final RegionRepository regionRepository;

    @GetMapping
    public ApiResponse<List<RegionResponse>> list() {
        var payload = regionRepository.findAllOrderByName()
                .stream().map(RegionResponse::from).toList();
        return ApiResponse.onSuccess(payload);
    }
}
