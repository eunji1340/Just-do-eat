package com.JDE.mainserver.global.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class LocalImageStorageService implements ImageStorageService {

    private final Path root;
    private final String publicPrefix;

    public LocalImageStorageService(
            @Value("${app.storage.local.root:uploads}") String rootDir,
            @Value("${app.storage.local.public-prefix:/uploads/}") String publicPrefix
    ) {
        this.root = Path.of(rootDir).toAbsolutePath().normalize();
        this.publicPrefix = publicPrefix.endsWith("/") ? publicPrefix : publicPrefix + "/";
        try { Files.createDirectories(this.root); } catch (IOException ignore) {}
    }

    @Override
    public String save(String originalFilename, InputStream content) {
        String ext = "";
        if (originalFilename != null) {
            int dot = originalFilename.lastIndexOf('.');
            if (dot > -1) ext = originalFilename.substring(dot);
        }
        String stored = UUID.randomUUID().toString().replace("-", "") + ext;
        Path target = root.resolve(stored);
        try {
            Files.copy(content, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return publicPrefix + stored;
    }

    @Override
    public void delete(String storedPathOrUrl) {
        if (storedPathOrUrl == null) return;
        String name = storedPathOrUrl.replace(publicPrefix, "");
        try { Files.deleteIfExists(root.resolve(name)); } catch (IOException ignore) {}
    }
}
