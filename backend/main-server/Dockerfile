# ---------- builder ----------
FROM public.ecr.aws/docker/library/eclipse-temurin:21-jdk AS builder
WORKDIR /app

# 1) Gradle 관련 파일만 먼저 복사 (레이어 캐시)
COPY gradlew gradlew
COPY gradle/ gradle/
COPY settings.gradle settings.gradle
COPY build.gradle build.gradle

RUN chmod +x gradlew

# 2) 의존성 선캐싱 (BuildKit 캐시 마운트)
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew --no-daemon dependencies || true

# 3) 소스는 나중에
COPY src/ src/

# 4) 빌드 (Gradle 캐시 재사용)
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew --no-daemon build -x test

# ---------- runtime ----------
FROM public.ecr.aws/docker/library/eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080

ENTRYPOINT ["java","-jar","app.jar"]
