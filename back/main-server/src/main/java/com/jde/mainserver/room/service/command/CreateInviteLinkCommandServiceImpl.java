package com.jde.mainserver.room.service.command;

import com.jde.mainserver.global.exception.CustomException;
import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.room.converter.RoomConverter;
import com.jde.mainserver.room.entity.Room;
import com.jde.mainserver.room.exception.RoomErrorCode;
import com.jde.mainserver.room.exception.RoomMemberErrorCode;
import com.jde.mainserver.room.repository.RoomMemberRepository;
import com.jde.mainserver.room.repository.RoomRepository;
import com.jde.mainserver.room.web.dto.response.CreateInviteLinkResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class CreateInviteLinkCommandServiceImpl implements CreateInviteLinkCommandService{

    private final RoomRepository roomRepository;
    private final RoomConverter roomConverter;
    private final RoomMemberRepository roomMemberRepository;
    private final RedisTemplate<String, Long> redisTemplate;
    @Value("${custom.front-base-url}")
    private String frontBaseUrl;

    public CreateInviteLinkResponse createInvite(Member user, Long roomId) {

        Room room = roomRepository.findByRoomId(roomId)
                .orElseThrow(() -> new CustomException(RoomErrorCode.NOT_FOUND_ROOM));

        boolean isRoomMember = roomMemberRepository.existsByUser_UserIdAndRoom_RoomIdAndIsDelFalse(user.getUserId(), roomId);

        if (!isRoomMember) {
            throw new CustomException(RoomMemberErrorCode.NOT_FOUND_USER);
        }

        final SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[16];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        String inviteLink = frontBaseUrl + "/invite?token=" + token;

        redisTemplate.opsForValue().set(
                "invite:" + token,
                roomId,
                Duration.ofHours(2)
        );

        return roomConverter.toCreateInviteLinkResponse(inviteLink);
    }
}
