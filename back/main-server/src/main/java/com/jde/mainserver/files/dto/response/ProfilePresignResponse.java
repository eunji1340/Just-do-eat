// ProfilePresignResponse.java
package com.jde.mainserver.files.dto.response;

import java.util.Map;

public record ProfilePresignResponse(
        String uploadUrl,
        String publicUrl,
        Map<String, String> headers,
        long expiresIn
) {}
