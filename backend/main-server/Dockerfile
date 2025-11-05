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
