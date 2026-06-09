package gr.projectfoodspots.dto;

public record PlaceFiltersDTO(
        String city,
        String country,
        Integer minRating,
        String q
) {
}

