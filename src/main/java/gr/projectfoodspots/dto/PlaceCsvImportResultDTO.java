package gr.projectfoodspots.dto;

import java.util.List;

public record PlaceCsvImportResultDTO(
        int importedCount,
        int skippedCount,
        int errorCount,
        List<String> errors
) {
}
