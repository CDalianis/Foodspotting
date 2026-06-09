package gr.projectfoodspots.service.impl;

import gr.projectfoodspots.common.exception.EntityNotFoundException;
import gr.projectfoodspots.mapper.PlaceMapper;
import gr.projectfoodspots.model.FavoritePlace;
import gr.projectfoodspots.model.User;
import gr.projectfoodspots.dto.PlaceCreateDTO;
import gr.projectfoodspots.dto.PlaceReadDTO;
import gr.projectfoodspots.dto.PlaceUpdateDTO;
import gr.projectfoodspots.place.filters.PlaceFilters;
import gr.projectfoodspots.place.filters.PlaceSpecifications;
import gr.projectfoodspots.repository.FavoritePlaceRepository;
import gr.projectfoodspots.repository.UserRepository;
import gr.projectfoodspots.service.IPlaceService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlaceServiceImpl implements IPlaceService {

    private final FavoritePlaceRepository favoritePlaceRepository;
    private final UserRepository userRepository;
    private final PlaceMapper placeMapper;

    @Override
    @Transactional
    public PlaceReadDTO create(String username, PlaceCreateDTO request) {
        log.debug("Creating place for username={}", username);
        User owner = getUserByUsername(username);
        FavoritePlace place = placeMapper.toEntity(request, owner);
        FavoritePlace saved = favoritePlaceRepository.save(place);
        log.info("Place created uuid={} by username={}", saved.getUuid(), username);
        return placeMapper.toReadDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PlaceReadDTO getOwnByUuid(String username, UUID placeUuid) {
        log.debug("Fetching place uuid={} for username={}", placeUuid, username);
        User owner = getUserByUsername(username);
        FavoritePlace place = favoritePlaceRepository.findByUuidAndUser(placeUuid, owner)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("FavoritePlace", "uuid=" + placeUuid));
        return placeMapper.toReadDTO(place);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PlaceReadDTO> getOwnFiltered(String username, PlaceFilters filters) {
        log.debug("Fetching filtered places for username={} page={} size={}",
                username, filters.getPage(), filters.getSize());
        User owner = getUserByUsername(username);
        Pageable pageable = buildPageable(filters);

        Specification<FavoritePlace> specification = PlaceSpecifications.withFilters(filters)
                .and((root, query, cb) -> cb.equal(root.get("user"), owner));

        return favoritePlaceRepository.findAll(specification, pageable).map(placeMapper::toReadDTO);
    }

    @Override
    @Transactional
    public PlaceReadDTO updateOwn(String username, UUID placeUuid, PlaceUpdateDTO request) {
        log.debug("Updating place uuid={} for username={}", placeUuid, username);
        User owner = getUserByUsername(username);
        FavoritePlace place = favoritePlaceRepository.findByUuidAndUser(placeUuid, owner)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("FavoritePlace", "uuid=" + placeUuid));

        placeMapper.updateEntity(place, request);
        FavoritePlace updated = favoritePlaceRepository.save(place);
        log.info("Place updated uuid={} by username={}", updated.getUuid(), username);
        return placeMapper.toReadDTO(updated);
    }

    @Override
    @Transactional
    public void deleteOwn(String username, UUID placeUuid) {
        log.debug("Soft deleting place uuid={} for username={}", placeUuid, username);
        User owner = getUserByUsername(username);
        FavoritePlace place = favoritePlaceRepository.findByUuidAndUser(placeUuid, owner)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("FavoritePlace", "uuid=" + placeUuid));

        place.setDeleted(true);
        place.setDeletedAt(java.time.LocalDateTime.now());
        favoritePlaceRepository.save(place);
        log.info("Place soft deleted uuid={} by username={}", placeUuid, username);
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User", "username=" + username));
    }

    private Pageable buildPageable(PlaceFilters filters) {
        String sortBy = filters.getSortBy() == null || filters.getSortBy().isBlank() ? "createdAt" : filters.getSortBy();
        String sortDirection = filters.getSortDirection() == null ? "desc" : filters.getSortDirection().toLowerCase();
        Sort.Direction direction = "asc".equals(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC;

        int page = filters.getPage() == null || filters.getPage() < 0 ? 0 : filters.getPage();
        int size = filters.getSize() == null || filters.getSize() <= 0 ? 20 : filters.getSize();

        return PageRequest.of(page, size, Sort.by(direction, sortBy));
    }
}
