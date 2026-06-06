package gr.projectfoodspots.dto;

import gr.projectfoodspots.model.PlaceTag;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PlaceReadDTO(
        UUID uuid,
        String name,
        String notes,
        BigDecimal latitude,
        BigDecimal longitude,
        String address,
        String streetNumber,
        String postalCode,
        String city,
        String country,
        String googlePlaceId,
        Integer rating,
        boolean isPublic,
        List<PlaceTag> tags,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}

