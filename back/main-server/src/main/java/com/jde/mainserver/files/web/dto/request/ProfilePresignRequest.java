// ProfilePresignRequest.java
package com.jde.mainserver.files.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ProfilePresignRequest(
        @NotBlank String fileName,
        @NotBlank String contentType
) {}
