package com.jde.mainserver.plan.web.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(
        description = "투표 집계 응답",
        example = """
                {
                  "planId": 1,
                  "results": [
                    {
                      "restaurantId": 100,
                      "votes": 3,
                      "userIds": [1, 2, 3]
                    },
                    {
                      "restaurantId": 200,
                      "votes": 2,
                      "userIds": [4, 5]
                    }
                  ],
                  "totalVotes": 5
                }
                """
)
public record TallyResponse(
        @Schema(description = "약속 ID", example = "1")
        Long planId,
        @Schema(description = "식당별 투표 집계 결과")
        List<Item> results,
        @Schema(description = "전체 투표 수", example = "5")
        long totalVotes
) {
    @Schema(description = "식당별 투표 집계 항목")
    public record Item(
            @Schema(description = "식당 ID", example = "100")
            Long restaurantId,
            @Schema(description = "투표 수", example = "3")
            long votes,
            @Schema(description = "투표한 사용자 ID 리스트", example = "[1, 2, 3]")
            List<Long> userIds
    ) {}
}
