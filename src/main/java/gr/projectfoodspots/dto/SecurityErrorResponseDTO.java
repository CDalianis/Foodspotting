package gr.projectfoodspots.dto;

public record SecurityErrorResponseDTO(String code, String description) {

    public SecurityErrorResponseDTO(String code) {
        this(code, "");
    }
}

