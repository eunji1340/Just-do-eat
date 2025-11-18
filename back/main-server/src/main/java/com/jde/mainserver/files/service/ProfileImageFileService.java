// ProfileImageFileService.java
package com.jde.mainserver.files.service;

import com.jde.mainserver.files.dto.response.ProfilePresignResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.*;

import java.net.URI;
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

    private static final Duration PRESIGNED_PUT_EXPIRATION = Duration.ofMinutes(5);
    private static final Duration PRESIGNED_GET_EXPIRATION = Duration.ofMinutes(30);

    /**
     * S3 업로드용 presigned PUT URL 생성
     */
    public ProfilePresignResponse createPresignedUrl(Long userId, String fileName, String contentType) {
        String ext = extractExtension(fileName);
        long now = System.currentTimeMillis();

        String key = "u/" + userId + "/" + now + "." + ext;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(PRESIGNED_PUT_EXPIRATION)
                .putObjectRequest(putObjectRequest)
                .build();

        PresignedPutObjectRequest presigned = s3Presigner.presignPutObject(presignRequest);

        String uploadUrl = presigned.url().toString();
        Map<String, String> headers = Map.of("Content-Type", contentType);

        String publicUrl = publicBaseUrl + "/" + key; // DB에는 이 값이 저장됨

        return new ProfilePresignResponse(uploadUrl, publicUrl, headers, PRESIGNED_PUT_EXPIRATION.toSeconds());
    }

    /**
     * 🔥 DB에 저장된 URL or key → 외부 접근 가능한 GET presigned URL 생성
     */
    public String generatePresignedGetUrl(String storedImageUrlOrKey) {
        if (storedImageUrlOrKey == null || storedImageUrlOrKey.isBlank()) {
            return null;
        }

        String objectKey = extractKey(storedImageUrlOrKey);

        GetObjectRequest objectRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(objectKey)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(PRESIGNED_GET_EXPIRATION)
                .getObjectRequest(objectRequest)
                .build();

        PresignedGetObjectRequest presigned = s3Presigner.presignGetObject(presignRequest);
        return presigned.url().toString();
    }

    /**
     * full URL이어도 key만 추출 (ex: https://bucket.s3.../u/9/xxx.png → u/9/xxx.png)
     */
    private String extractKey(String stored) {
        if (stored == null || stored.isBlank()) {
            return null;
        }
        if (!stored.startsWith("http://") && !stored.startsWith("https://")) {
            return stored;
        }
        try {
            URI uri = URI.create(stored);
            String path = uri.getPath(); // "/u/9/....png"
            return path.startsWith("/") ? path.substring(1) : path;
        } catch (Exception e) {
            // URL 파싱 실패하면 원본 그대로 사용
            return stored;
        }
    }

    private String extractExtension(String fileName) {
        int idx = fileName.lastIndexOf('.');
        if (idx == -1 || idx == fileName.length() - 1) {
            return "png"; // fallback
        }
        return fileName.substring(idx + 1);
    }
}
