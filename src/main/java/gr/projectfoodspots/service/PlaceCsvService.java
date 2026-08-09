package gr.projectfoodspots.service;

import gr.projectfoodspots.common.exception.InvalidArgumentException;
import gr.projectfoodspots.dto.PlaceCreateDTO;
import gr.projectfoodspots.dto.PlaceCsvImportResultDTO;
import gr.projectfoodspots.dto.PlaceReadDTO;
import gr.projectfoodspots.model.PlaceTag;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlaceCsvService {

    public static final String[] CSV_HEADERS = {
            "name",
            "notes",
            "latitude",
            "longitude",
            "address",
            "streetNumber",
            "postalCode",
            "city",
            "country",
            "googlePlaceId",
            "rating",
            "isPublic",
            "tags"
    };

    private final IPlaceService placeService;

    @Transactional(readOnly = true)
    public byte[] exportOwnPlaces(String username) {
        List<PlaceReadDTO> places = placeService.getAllOwn(username);
        try (StringWriter writer = new StringWriter();
             CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.builder()
                     .setHeader(CSV_HEADERS)
                     .build())) {

            for (PlaceReadDTO place : places) {
                printer.printRecord(
                        nullToEmpty(place.name()),
                        nullToEmpty(place.notes()),
                        place.latitude(),
                        place.longitude(),
                        nullToEmpty(place.address()),
                        nullToEmpty(place.streetNumber()),
                        nullToEmpty(place.postalCode()),
                        nullToEmpty(place.city()),
                        nullToEmpty(place.country()),
                        nullToEmpty(place.googlePlaceId()),
                        place.rating() == null ? "" : place.rating(),
                        place.isPublic(),
                        formatTags(place.tags())
                );
            }
            printer.flush();
            return writer.toString().getBytes(StandardCharsets.UTF_8);
        } catch (IOException ex) {
            throw new InvalidArgumentException("Failed to export places to CSV");
        }
    }

    public PlaceCsvImportResultDTO importOwnPlaces(String username, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidArgumentException("CSV file is required");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && !originalFilename.toLowerCase(Locale.ROOT).endsWith(".csv")) {
            throw new InvalidArgumentException("Only .csv files are supported");
        }

        int importedCount = 0;
        int skippedCount = 0;
        List<String> errors = new ArrayList<>();

        try (InputStream inputStream = file.getInputStream();
             BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8));
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setIgnoreEmptyLines(true)
                     .setTrim(true)
                     .setIgnoreHeaderCase(true)
                     .build()
                     .parse(reader)) {

            validateHeaders(parser.getHeaderNames());

            for (CSVRecord record : parser) {
                long rowNumber = record.getRecordNumber() + 1; // +1 for header row display
                if (isBlankRecord(record)) {
                    skippedCount++;
                    continue;
                }

                try {
                    PlaceCreateDTO dto = toCreateDto(record);
                    placeService.create(username, dto);
                    importedCount++;
                } catch (Exception ex) {
                    errors.add("Row " + rowNumber + ": " + ex.getMessage());
                }
            }
        } catch (InvalidArgumentException ex) {
            throw ex;
        } catch (IOException ex) {
            throw new InvalidArgumentException("Failed to read CSV file");
        }

        log.info("CSV import finished for username={} imported={} skipped={} errors={}",
                username, importedCount, skippedCount, errors.size());

        return new PlaceCsvImportResultDTO(importedCount, skippedCount, errors.size(), errors);
    }

    private void validateHeaders(List<String> headers) {
        if (headers == null || headers.isEmpty()) {
            throw new InvalidArgumentException("CSV header row is missing");
        }

        List<String> normalized = headers.stream()
                .map(h -> h == null ? "" : h.trim().toLowerCase(Locale.ROOT))
                .toList();

        for (String required : List.of("name", "latitude", "longitude", "tags")) {
            if (!normalized.contains(required)) {
                throw new InvalidArgumentException("CSV must include header column: " + required);
            }
        }
    }

    private PlaceCreateDTO toCreateDto(CSVRecord record) {
        String name = get(record, "name");
        if (name.isBlank()) {
            throw new InvalidArgumentException("name is required");
        }

        BigDecimal latitude = parseBigDecimal(get(record, "latitude"), "latitude");
        BigDecimal longitude = parseBigDecimal(get(record, "longitude"), "longitude");
        List<PlaceTag> tags = parseTags(get(record, "tags"));
        if (tags.isEmpty()) {
            throw new InvalidArgumentException("at least one tag is required");
        }

        Integer rating = parseOptionalRating(get(record, "rating"));
        Boolean isPublic = parseOptionalBoolean(get(record, "isPublic"));

        String notes = emptyToNull(get(record, "notes"));
        String address = emptyToNull(get(record, "address"));
        String streetNumber = emptyToNull(get(record, "streetNumber"));
        String postalCode = emptyToNull(get(record, "postalCode"));
        String city = emptyToNull(get(record, "city"));
        String country = emptyToNull(get(record, "country"));
        String googlePlaceId = emptyToNull(get(record, "googlePlaceId"));

        return new PlaceCreateDTO(
                name,
                notes,
                latitude,
                longitude,
                address,
                streetNumber,
                postalCode,
                city,
                country,
                googlePlaceId,
                rating,
                isPublic,
                tags
        );
    }

    private String get(CSVRecord record, String header) {
        if (!record.isMapped(header)) {
            return "";
        }
        String value = record.get(header);
        return value == null ? "" : value.trim();
    }

    private boolean isBlankRecord(CSVRecord record) {
        for (String header : CSV_HEADERS) {
            if (!get(record, header).isBlank()) {
                return false;
            }
        }
        return true;
    }

    private BigDecimal parseBigDecimal(String value, String field) {
        if (value.isBlank()) {
            throw new InvalidArgumentException(field + " is required");
        }
        try {
            return new BigDecimal(value);
        } catch (NumberFormatException ex) {
            throw new InvalidArgumentException(field + " must be a number");
        }
    }

    private Integer parseOptionalRating(String value) {
        if (value.isBlank()) {
            return null;
        }
        try {
            int rating = Integer.parseInt(value);
            if (rating < 1 || rating > 5) {
                throw new InvalidArgumentException("rating must be between 1 and 5");
            }
            return rating;
        } catch (NumberFormatException ex) {
            throw new InvalidArgumentException("rating must be an integer between 1 and 5");
        }
    }

    private Boolean parseOptionalBoolean(String value) {
        if (value.isBlank()) {
            return Boolean.FALSE;
        }
        if ("true".equalsIgnoreCase(value) || "1".equals(value) || "yes".equalsIgnoreCase(value)) {
            return Boolean.TRUE;
        }
        if ("false".equalsIgnoreCase(value) || "0".equals(value) || "no".equalsIgnoreCase(value)) {
            return Boolean.FALSE;
        }
        throw new InvalidArgumentException("isPublic must be true/false");
    }

    private List<PlaceTag> parseTags(String value) {
        if (value.isBlank()) {
            return List.of();
        }
        return Arrays.stream(value.split("[|;,]"))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(tag -> {
                    try {
                        return PlaceTag.valueOf(tag.toUpperCase(Locale.ROOT));
                    } catch (IllegalArgumentException ex) {
                        throw new InvalidArgumentException("unknown tag: " + tag);
                    }
                })
                .distinct()
                .toList();
    }

    private String formatTags(List<PlaceTag> tags) {
        if (tags == null || tags.isEmpty()) {
            return "";
        }
        return String.join("|", tags.stream().map(Enum::name).toList());
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
