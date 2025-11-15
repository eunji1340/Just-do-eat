package com.jde.mainserver.room.converter;

import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.plan.entity.Plan;
import com.jde.mainserver.restaurants.entity.Restaurant;
import com.jde.mainserver.room.entity.Room;
import com.jde.mainserver.room.entity.RoomMember;
import com.jde.mainserver.room.web.dto.response.*;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class RoomConverter {
    public CreateRoomResponse toCreateRoomResponse(Room room) {
        return CreateRoomResponse.builder()
                .roomId(room.getRoomId())
                .roomName(room.getRoomName())
                .members(
                        room.getRoomMemberList().stream()
                                .map(this::toMemberInfo)
                                .toList()
                )
                .build();
    }

    public GetMyRoomResponse toGetMyRoomResponse(List<Room> rooms) {
        return GetMyRoomResponse.builder()
                .roomList(rooms.stream()
                        .map(this::toMyRoomInfo)
                        .toList())
                .build();
    }
    public MyRoomInfo toMyRoomInfo(Room room) {

        List<MemberInfo> roomMemberList = room.getRoomMemberList().stream()
                .filter(roomMember -> !roomMember.isDel())
                .map(this::toMemberInfo)
                .toList();

        List<PlanRestaurantImageInfo> planList = room.getPlanList().stream()
                .map(this::toPlanList)
                .toList();

        return MyRoomInfo.builder()
                .roomId(room.getRoomId())
                .roomName(room.getRoomName())
                .roomMemberList(roomMemberList)
                .planList(planList)
                .build();
    }
    private MemberInfo toMemberInfo(RoomMember roomMember) {
        Member user = roomMember.getUser(); // Member 엔티티

        return MemberInfo.builder()
                .roomMemberId(roomMember.getRoomMemberId())
                .userId(user.getUserId())
                .userName(user.getName())
                .imageUrl(user.getImageUrl())
                .isDel(roomMember.isDel())
                .build();
    }

    private PlanRestaurantImageInfo toPlanList(Plan plan) {
        Restaurant restaurant = plan.getRestaurant();
        String firstImage;

        if(restaurant != null && restaurant.getImage() != null && !restaurant.getImage().isEmpty()) {
            firstImage = restaurant.getImage().get(0);
        }
        return PlanRestaurantImageInfo.builder()
                .planId(plan.getPlanId())
                .startAt(plan.getStartsAt())
                .restaurantImageUrl(plan.getRestaurant().getImage().get(0))
                .build();
    }
}
