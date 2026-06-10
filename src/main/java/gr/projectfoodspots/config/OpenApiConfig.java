package gr.projectfoodspots.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.HandlerMethod;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "FoodSpots API",
                version = "v1",
                description = "REST API for user authentication and favorite food places management.",
                contact = @Contact(name = "FoodSpots Team")
        )
)
@SecurityScheme(
        name = "Bearer Authentication",
        type = SecuritySchemeType.HTTP,
        bearerFormat = "JWT",
        scheme = "bearer",
        in = SecuritySchemeIn.HEADER
)
public class OpenApiConfig {

    @Bean
    public OperationCustomizer customizeSecuredResponses() {
        return (Operation operation, HandlerMethod handlerMethod) -> {
            if (operation.getSecurity() != null && !operation.getSecurity().isEmpty()) {
                ApiResponses responses = operation.getResponses();
                if (!responses.containsKey("401")) {
                    responses.addApiResponse("401", new ApiResponse().description("Unauthorized"));
                }
                if (!responses.containsKey("403")) {
                    responses.addApiResponse("403", new ApiResponse().description("Forbidden"));
                }
            }
            return operation;
        };
    }
}
