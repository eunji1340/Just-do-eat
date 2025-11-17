package com.jde.mainserver.room.service.query;

import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.restaurants.repository.RestaurantRepository;
import com.jde.mainserver.room.converter.RoomConverter;
import com.jde.mainserver.room.entity.Room;
import com.jde.mainserver.room.entity.RoomMember;
import com.jde.mainserver.room.repository.RoomMemberRepository;
import com.jde.mainserver.room.repository.RoomRepository;
import com.jde.mainserver.room.web.dto.response.GetMyRoomResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GetMyRoomQueryServiceImpl implements GetMyRoomQueryService{

    private final RestaurantRepository restaurantRepository;
    private final RoomRepository roomRepository;
    private final RoomConverter roomConverter;
    private final RoomMemberRepository roomMemberRepository;

    @Override
    public GetMyRoomResponse getMyRoom(Member user) {
        // user가 가입한 모임들 가져오기
        // 방들을 순회하면서 멤버, 플랜, 식당까지 한번에 조회

        List<RoomMember> RoomMemberList = roomMemberRepository.findByUserAndIsDel(user, false);

        List<Room> myRooms = RoomMemberList.stream()
                .map(rm -> rm.getRoom())
                .toList();

        return roomConverter.toGetMyRoomResponse(myRooms);
    }
}
