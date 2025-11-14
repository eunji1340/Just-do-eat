// ProfileImageFileService.java
package com.jde.mainserver.files.service;

import com.jde.mainserver.files.dto.response.ProfilePresignResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProfileImageFileService {

    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Value("${aws.s3.base-url}")
    private String publicBaseUrl;

    public ProfilePresignResponse createPresignedUrl(Long userId, String fileName, String contentType) {
        String ext = extractExtension(fileName);
        long now = System.currentTimeMillis();

        // u/{userId}/{timestamp}.{ext}
        String key = "u/" + userId + "/" + now + "." + ext;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(5)) // 5분 만료
                .putObjectRequest(putObjectRequest)
                .build();

        PresignedPutObjectRequest presigned = s3Presigner.presignPutObject(presignRequest);

        String uploadUrl = presigned.url().toString();
        Map<String, String> headers = Map.of("Content-Type", contentType);
        String publicUrl = publicBaseUrl + "/" + key;

        return new ProfilePresignResponse(uploadUrl, publicUrl, headers, 300L);
    }

    private String extractExtension(String fileName) {
        int idx = fileName.lastIndexOf('.');
        if (idx == -1 || idx == fileName.length() - 1) {
            return "png"; // fallback
        }
        return fileName.substring(idx + 1);
    }
}
