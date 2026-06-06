package gr.projectfoodspots.dto;

import java.util.UUID;

public record UserReadDTO(
        UUID uuid,
        String username,
        String email,
        boolean active,
        String role
) {
}

