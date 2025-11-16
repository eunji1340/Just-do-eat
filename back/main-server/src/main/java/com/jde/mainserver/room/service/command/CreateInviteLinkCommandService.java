package com.jde.mainserver.room.service.command;

import com.jde.mainserver.member.entity.Member;
import com.jde.mainserver.room.web.dto.response.CreateInviteLinkResponse;

public interface CreateInviteLinkCommandService {

    CreateInviteLinkResponse createInvite(Member user, Long roomId);
}
