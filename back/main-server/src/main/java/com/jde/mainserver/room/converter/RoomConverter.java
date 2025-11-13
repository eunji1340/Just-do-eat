package com.jde.mainserver.room.converter;

import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.room.entity.Room;
import com.jde.mainserver.room.entity.RoomMember;
import com.jde.mainserver.room.web.dto.response.CreateRoomResponse;
import com.jde.mainserver.room.web.dto.response.MemberInfo;
import org.springframework.stereotype.Component;

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
}
