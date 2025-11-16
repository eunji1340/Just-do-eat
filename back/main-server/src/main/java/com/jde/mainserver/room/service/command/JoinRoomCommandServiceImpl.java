package com.jde.mainserver.room.service.command;

import com.jde.mainserver.global.exception.CustomException;
import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.room.converter.RoomConverter;
import com.jde.mainserver.room.entity.Room;
import com.jde.mainserver.room.entity.RoomMember;
import com.jde.mainserver.room.exception.RoomErrorCode;
import com.jde.mainserver.room.repository.RoomMemberRepository;
import com.jde.mainserver.room.repository.RoomRepository;
import com.jde.mainserver.room.web.dto.response.JoinRoomResponse;
import com.jde.mainserver.room.web.dto.response.JoinStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class JoinRoomCommandServiceImpl implements JoinRoomCommandService {

    private final RoomConverter roomConverter;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final RedisTemplate<String, Long> redisTemplate;
    public JoinRoomResponse joinRoom(String token, Member user) {

        Long roomId = redisTemplate.opsForValue().get("invite:" + token);

        if(roomId == null) {
            throw new CustomException(RoomErrorCode.EXPIRED_TOKEN);
        }

        Room room = roomRepository.findByRoomId(roomId)
                .orElseThrow(() -> new CustomException(RoomErrorCode.NOT_FOUND_ROOM));

        RoomMember roomMember = roomMemberRepository.findByRoom_RoomIdAndUser_UserId(roomId, user.getUserId())
                .orElse(null);

        if (roomMember != null) {

            if(roomMember.isDel()) {
                roomMember.revive();
                return roomConverter.toJoinRoomResponse(roomId, JoinStatus.REJOIN);
            }

            return roomConverter.toJoinRoomResponse(roomId, JoinStatus.ALREADY);
        } else {
            RoomMember newRoomMember =RoomMember.builder()
                    .user(user)
                    .isDel(false)
                    .room(room)
                    .build();

            roomMemberRepository.save(newRoomMember);
            return roomConverter.toJoinRoomResponse(roomId, JoinStatus.JOIN);
        }
    }
}
