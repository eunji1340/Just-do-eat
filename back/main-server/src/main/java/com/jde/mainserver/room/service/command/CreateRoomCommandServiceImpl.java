package com.jde.mainserver.room.service.command;

import com.jde.mainserver.global.exception.CustomException;
import com.jde.mainserver.global.exception.code.GeneralErrorCode;
import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.member.repository.MemberRepository;
import com.jde.mainserver.room.converter.RoomConverter;
import com.jde.mainserver.room.entity.Room;
import com.jde.mainserver.room.entity.RoomMember;
import com.jde.mainserver.room.repository.RoomRepository;
import com.jde.mainserver.room.web.dto.request.CreateRoomRequest;
import com.jde.mainserver.room.web.dto.response.CreateRoomResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Optional;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class CreateRoomCommandServiceImpl implements CreateRoomCommandService {

    private final MemberRepository memberRepository;
    private final RoomRepository roomRepository;
    private final RoomConverter roomConverter;
    @Override
    public CreateRoomResponse createRoom(CreateRoomRequest request, Long userId) {

        String roomName = request.getRoomName();

        Member user = memberRepository.findByUserId(userId)
                .orElseThrow(() -> new CustomException(GeneralErrorCode.NOT_USER));

        Room room = Room.builder()
                .roomName(roomName)
                .roomMemberList(new ArrayList<>())
                .planList(new ArrayList<>())
                .build();

        RoomMember roomMember = RoomMember.builder()
                .user(user)
                .isDel(false)
                .build();

        room.addMember(roomMember);

        Room savedRoom = roomRepository.save(room);

        return roomConverter.toCreateRoomResponse(savedRoom);
    }
}
