
# ---------- builder 단계 ----------
# [설명] build용 이미지 (JDK + Gradle 실행 환경)
FROM public.ecr.aws/docker/library/eclipse-temurin:21-jdk AS builder

# [설명] 작업 디렉토리 설정
WORKDIR /app

# 1️⃣ Gradle 관련 파일만 먼저 복사 (의존성 캐시를 위해)
COPY gradlew gradlew
COPY gradle/ gradle/
COPY settings.gradle settings.gradle
COPY build.gradle build.gradle

# 2️⃣ gradlew 실행 권한 부여
RUN chmod +x gradlew

# 3️⃣ Gradle 의존성 미리 받아오기 (BuildKit 캐시 마운트)
# [설명] 빌드 시 가장 오래 걸리는 dependency 다운로드를 캐시 처리
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew --no-daemon dependencies || true

# 4️⃣ 이후에 소스코드 복사 (자주 바뀌므로 마지막에)
COPY src/ src/

# 5️⃣ 빌드 실행 (Gradle 캐시 재사용)
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew --no-daemon clean build -x test


# ---------- runtime 단계 ----------
# [설명] 실행용 이미지 (JRE만 포함 → 경량화)
FROM public.ecr.aws/docker/library/eclipse-temurin:21-jre

# [설명] 작업 디렉토리 설정
WORKDIR /app

# 6️⃣ builder 단계에서 빌드된 jar 파일만 복사
COPY --from=builder /app/build/libs/*.jar app.jar

# 7️⃣ 컨테이너가 열어둘 포트
EXPOSE 8080

# 8️⃣ 애플리케이션 실행 명령어
ENTRYPOINT ["java", "-jar", "app.jar"]
=======
# ---------- Build stage ----------
FROM gradle:8.7-jdk21-alpine AS build
WORKDIR /home/gradle/project
COPY build.gradle settings.gradle gradle gradlew ./
RUN chmod +x gradlew || true
RUN ./gradlew --no-daemon dependencies || true
COPY . .
RUN ./gradlew --no-daemon clean bootJar -x test

# ---------- Run stage ----------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
ENV TZ=Asia/Seoul
COPY --from=build /home/gradle/project/build/libs/*SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
