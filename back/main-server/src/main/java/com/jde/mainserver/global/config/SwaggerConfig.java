package com.jde.mainserver.global.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Collections;
import java.util.List;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        SecurityScheme securityScheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("Bearer")
                .bearerFormat("JWT")
                .in(SecurityScheme.In.HEADER)
                .name("Authorization");

        return new OpenAPI()
                .servers(List.of(
                        new Server().url("/api").description("Nginx base path")
                ))
                .components(new Components()
                        .addSecuritySchemes("Json Web Token(JWT)", securityScheme))
                // 전역 보안 요구사항 제거 - 각 API에서 필요시 @SecurityRequirement 사용
                .info(new Info()
                        .title("JUST DO EAT API")
                        .description("JUST DO EAT API 명세서"));
    }
}