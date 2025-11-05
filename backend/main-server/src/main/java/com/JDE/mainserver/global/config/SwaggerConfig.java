/**
 * global/config/SwaggerConfig.java
 * Swagger API 문서 설정
 * Author: Jang
 * Date: 2025-11-04
 */

package com.JDE.mainserver.global.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Collections;

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

        SecurityRequirement securityRequirement = new SecurityRequirement()
            .addList("Json Web Token(JWT)");

        return new OpenAPI()
            .components(new Components()
                .addSecuritySchemes("Json Web Token(JWT)", securityScheme))
            .security(Collections.singletonList(securityRequirement))
            .info(new Info()
                .title("JUST DO EAT API")
                .description("JUST DO EAT API 명세서"));
    }
}

