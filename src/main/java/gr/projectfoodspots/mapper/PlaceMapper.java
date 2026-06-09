package gr.projectfoodspots.mapper;

import gr.projectfoodspots.model.FavoritePlace;
import gr.projectfoodspots.model.User;
import gr.projectfoodspots.dto.PlaceCreateDTO;
import gr.projectfoodspots.dto.PlaceReadDTO;
import gr.projectfoodspots.dto.PlaceUpdateDTO;
import org.springframework.stereotype.Component;

@Component
public class PlaceMapper {

    public FavoritePlace toEntity(PlaceCreateDTO dto, User owner) {
        FavoritePlace place = new FavoritePlace();
        place.setUser(owner);
        place.setName(dto.name());
        place.setNotes(dto.notes());
        place.setLatitude(dto.latitude());
        place.setLongitude(dto.longitude());
        place.setAddress(dto.address());
        place.setStreetNumber(dto.streetNumber());
        place.setPostalCode(dto.postalCode());
        place.setCity(dto.city());
        place.setCountry(dto.country());
        place.setGooglePlaceId(dto.googlePlaceId());
        place.setRating(dto.rating());
        if (dto.isPublic() != null) {
            place.setPublic(dto.isPublic());
        }
        if (dto.tags() != null) {
            place.setTags(dto.tags());
        }
        return place;
    }

    public void updateEntity(FavoritePlace place, PlaceUpdateDTO dto) {
        if (dto.name() != null) {
            place.setName(dto.name());
        }
        if (dto.notes() != null) {
            place.setNotes(dto.notes());
        }
        if (dto.latitude() != null) {
            place.setLatitude(dto.latitude());
        }
        if (dto.longitude() != null) {
            place.setLongitude(dto.longitude());
        }
        if (dto.address() != null) {
            place.setAddress(dto.address());
        }
        if (dto.streetNumber() != null) {
            place.setStreetNumber(dto.streetNumber());
        }
        if (dto.postalCode() != null) {
            place.setPostalCode(dto.postalCode());
        }
        if (dto.city() != null) {
            place.setCity(dto.city());
        }
        if (dto.country() != null) {
            place.setCountry(dto.country());
        }
        if (dto.googlePlaceId() != null) {
            place.setGooglePlaceId(dto.googlePlaceId());
        }
        if (dto.rating() != null) {
            place.setRating(dto.rating());
        }
        if (dto.isPublic() != null) {
            place.setPublic(dto.isPublic());
        }
        if (dto.tags() != null) {
            place.setTags(dto.tags());
        }
    }

    public PlaceReadDTO toReadDTO(FavoritePlace place) {
        return new PlaceReadDTO(
                place.getUuid(),
                place.getName(),
                place.getNotes(),
                place.getLatitude(),
                place.getLongitude(),
                place.getAddress(),
                place.getStreetNumber(),
                place.getPostalCode(),
                place.getCity(),
                place.getCountry(),
                place.getGooglePlaceId(),
                place.getRating(),
                place.isPublic(),
                place.getTags(),
                place.getCreatedAt(),
                place.getUpdatedAt()
        );
    }
}
