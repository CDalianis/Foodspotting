package gr.projectfoodspots.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import gr.projectfoodspots.model.PlaceTag;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public record PlaceUpdateDTO(
        @Size(max = 200, message = "Name can have at most 200 characters")
        String name,
        @Size(max = 2000, message = "Notes can have at most 2000 characters")
        String notes,
        @DecimalMin(value = "-90.0", message = "Latitude must be >= -90")
        @DecimalMax(value = "90.0", message = "Latitude must be <= 90")
        BigDecimal latitude,
        @DecimalMin(value = "-180.0", message = "Longitude must be >= -180")
        @DecimalMax(value = "180.0", message = "Longitude must be <= 180")
        BigDecimal longitude,
        @Size(max = 300, message = "Address can have at most 300 characters")
        String address,
        @Size(max = 20, message = "Street number can have at most 20 characters")
        String streetNumber,
        @Size(max = 20, message = "Postal code can have at most 20 characters")
        String postalCode,
        @Size(max = 120, message = "City can have at most 120 characters")
        String city,
        @Size(max = 120, message = "Country can have at most 120 characters")
        String country,
        @Size(max = 255, message = "Google place id can have at most 255 characters")
        String googlePlaceId,
        @Min(value = 1, message = "Rating must be between 1 and 5")
        @Max(value = 5, message = "Rating must be between 1 and 5")
        Integer rating,
        Boolean isPublic,
        List<PlaceTag> tags
) {
}

