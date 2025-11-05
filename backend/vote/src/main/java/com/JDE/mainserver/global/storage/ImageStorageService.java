package com.JDE.mainserver.global.storage;

import java.io.InputStream;

public interface ImageStorageService {
    String save(String originalFilename, InputStream content);
    void delete(String storedPathOrUrl);
}
