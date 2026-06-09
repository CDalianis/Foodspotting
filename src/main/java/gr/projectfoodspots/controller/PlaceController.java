package gr.projectfoodspots.controller;

import gr.projectfoodspots.dto.PlaceCreateDTO;
import gr.projectfoodspots.dto.PlaceReadDTO;
import gr.projectfoodspots.dto.PlaceTagDTO;
import gr.projectfoodspots.dto.PlaceUpdateDTO;
import gr.projectfoodspots.model.PlaceTag;
import gr.projectfoodspots.model.User;
import gr.projectfoodspots.place.filters.PlaceFilters;
import gr.projectfoodspots.service.IPlaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/places")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Favorite Places", description = "CRUD operations for user's favorite food places")
@SecurityRequirement(name = "Bearer Authentication")
public class PlaceController {

    private final IPlaceService placeService;

    @PostMapping
    @Operation(summary = "Create a favorite place")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Place created"),
            @ApiResponse(responseCode = "400", description = "Invalid input")
    })
    public ResponseEntity<PlaceReadDTO> create(
            Authentication authentication,
            @Valid @RequestBody PlaceCreateDTO request
    ) {
        User user = (User) authentication.getPrincipal();
        log.info("Create place request by username={}", user.getUsername());
        PlaceReadDTO response = placeService.create(user.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/tags")
    @Operation(summary = "List available place tags")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tags returned")
    })
    public ResponseEntity<List<PlaceTagDTO>> getAvailableTags() {
        List<PlaceTagDTO> tags = Arrays.stream(PlaceTag.values())
                .map(tag -> new PlaceTagDTO(tag.name(), tag.getLabel()))
                .toList();
        return ResponseEntity.ok(tags);
    }

    @GetMapping("/{uuid}")
    @Operation(summary = "Get one place by UUID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Place returned"),
            @ApiResponse(responseCode = "404", description = "Place not found")
    })
    public ResponseEntity<PlaceReadDTO> getByUuid(
            Authentication authentication,
            @PathVariable UUID uuid
    ) {
        User user = (User) authentication.getPrincipal();
        log.info("Get place request by username={} uuid={}", user.getUsername(), uuid);
        return ResponseEntity.ok(placeService.getOwnByUuid(user.getUsername(), uuid));
    }

    @GetMapping
    @Operation(summary = "Get paginated and filtered favorite places")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Places returned")
    })
    public ResponseEntity<Page<PlaceReadDTO>> getFiltered(
            Authentication authentication,
            @ModelAttribute PlaceFilters filters
    ) {
        User user = (User) authentication.getPrincipal();
        log.info("Get filtered places request by username={} page={} size={}",
                user.getUsername(), filters.getPage(), filters.getSize());
        return ResponseEntity.ok(placeService.getOwnFiltered(user.getUsername(), filters));
    }

    @PutMapping("/{uuid}")
    @Operation(summary = "Update an existing favorite place")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Place updated"),
            @ApiResponse(responseCode = "404", description = "Place not found")
    })
    public ResponseEntity<PlaceReadDTO> update(
            Authentication authentication,
            @PathVariable UUID uuid,
            @Valid @RequestBody PlaceUpdateDTO request
    ) {
        User user = (User) authentication.getPrincipal();
        log.info("Update place request by username={} uuid={}", user.getUsername(), uuid);
        return ResponseEntity.ok(placeService.updateOwn(user.getUsername(), uuid, request));
    }

    @DeleteMapping("/{uuid}")
    @Operation(summary = "Soft delete a favorite place")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Place deleted"),
            @ApiResponse(responseCode = "404", description = "Place not found")
    })
    public ResponseEntity<Void> delete(
            Authentication authentication,
            @PathVariable UUID uuid
    ) {
        User user = (User) authentication.getPrincipal();
        log.info("Delete place request by username={} uuid={}", user.getUsername(), uuid);
        placeService.deleteOwn(user.getUsername(), uuid);
        return ResponseEntity.noContent().build();
    }
}
