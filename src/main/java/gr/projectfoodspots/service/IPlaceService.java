package gr.projectfoodspots.service;

import gr.projectfoodspots.dto.PlaceCreateDTO;
import gr.projectfoodspots.dto.PlaceReadDTO;
import gr.projectfoodspots.dto.PlaceUpdateDTO;
import gr.projectfoodspots.place.filters.PlaceFilters;
import java.util.UUID;
import org.springframework.data.domain.Page;

public interface IPlaceService {

    PlaceReadDTO create(String username, PlaceCreateDTO request);

    PlaceReadDTO getOwnByUuid(String username, UUID placeUuid);

    Page<PlaceReadDTO> getOwnFiltered(String username, PlaceFilters filters);

    PlaceReadDTO updateOwn(String username, UUID placeUuid, PlaceUpdateDTO request);

    void deleteOwn(String username, UUID placeUuid);
}
