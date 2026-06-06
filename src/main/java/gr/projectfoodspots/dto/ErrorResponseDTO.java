package gr.projectfoodspots.dto;

import java.time.LocalDateTime;
import java.util.Map;

public record ErrorResponseDTO(
        String errorCode,
        String message,
        int status,
        LocalDateTime timestamp,
        Map<String, String> validationErrors
) {
}

