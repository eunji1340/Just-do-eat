package com.jde.mainserver.rooms.service.command;

import com.jde.mainserver.rooms.entity.Room;
import com.jde.mainserver.rooms.entity.RoomMember;
import com.jde.mainserver.rooms.repository.RoomRepository;
import com.jde.mainserver.rooms.web.dto.request.CreateRoomRequest;
import com.jde.mainserver.rooms.web.dto.response.CreateRoomResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@Transactional
@RequiredArgsConstructor
public class CreateRoomCommandServiceImpl implements CreateRoomCommandService {

    private final RoomRepository roomRepository;
    @Override
    public CreateRoomResponse createRoom(CreateRoomRequest request) {

        String roomName = request.getRoomName();

        Room room = Room.builder()
                .roomName(roomName)
                .build();

        RoomMember roomMember = RoomMember.builder()
//                .userId(User.getUserId())
                .isDel(false)
                .build();

        room.addMember(roomMember);

        Room savedRoom = roomRepository.save(room);
        CreateRoomResponse r = new CreateRoomResponse();

        return r;
    }
}
