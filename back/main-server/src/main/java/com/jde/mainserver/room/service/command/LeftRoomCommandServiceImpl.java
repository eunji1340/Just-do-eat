package com.jde.mainserver.room.service.command;

import com.jde.mainserver.global.exception.CustomException;
import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.room.converter.RoomConverter;
import com.jde.mainserver.room.entity.Room;
import com.jde.mainserver.room.entity.RoomMember;
import com.jde.mainserver.room.exception.RoomErrorCode;
import com.jde.mainserver.room.exception.RoomMemberErrorCode;
import com.jde.mainserver.room.repository.RoomMemberRepository;
import com.jde.mainserver.room.repository.RoomRepository;
import com.jde.mainserver.room.web.dto.response.LeftRoomResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class LeftRoomCommandServiceImpl implements LeftRoomCommandService{

    private final RoomConverter roomConverter;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    public LeftRoomResponse leftRoom(Member user, Long roomId) {

        Room room = roomRepository.findByRoomId(roomId)
                .orElseThrow(() -> new CustomException(RoomErrorCode.NOT_FOUND_ROOM));

        RoomMember roomMember = roomMemberRepository.findByRoom_RoomIdAndUser_UserId(roomId, user.getUserId())
                .orElseThrow(() -> new CustomException(RoomMemberErrorCode.NOT_FOUND_USER));

        if (roomMember.isDel()) {
            throw new CustomException(RoomMemberErrorCode.NOT_MEMBER);
        }

        roomMember.softDelete();

        Long count = roomMemberRepository.countByRoom_RoomIdAndIsDelFalse(roomId);

        if(count == 0) {
            roomRepository.delete(room);
        }

        return roomConverter.toLeftRoomResponse(roomId);
    }
}
