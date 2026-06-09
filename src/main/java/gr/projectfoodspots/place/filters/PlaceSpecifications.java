package gr.projectfoodspots.place.filters;

import gr.projectfoodspots.model.FavoritePlace;
import gr.projectfoodspots.model.PlaceTag;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

public final class PlaceSpecifications {

    private PlaceSpecifications() {
    }

    public static Specification<FavoritePlace> withFilters(PlaceFilters filters) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isFalse(root.get("deleted")));

            if (filters.getUuid() != null) {
                predicates.add(cb.equal(root.get("uuid"), filters.getUuid()));
            }
            if (hasText(filters.getCity())) {
                predicates.add(cb.equal(cb.lower(root.get("city")), filters.getCity().toLowerCase()));
            }
            if (hasText(filters.getCountry())) {
                predicates.add(cb.equal(cb.lower(root.get("country")), filters.getCountry().toLowerCase()));
            }
            if (filters.getMinRating() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("rating"), filters.getMinRating()));
            }
            if (filters.getMaxRating() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("rating"), filters.getMaxRating()));
            }
            if (filters.getIsPublic() != null) {
                predicates.add(cb.equal(root.get("isPublic"), filters.getIsPublic()));
            }
            if (hasText(filters.getQ())) {
                String pattern = "%" + filters.getQ().toLowerCase() + "%";
                predicates.add(
                        cb.or(
                                cb.like(cb.lower(root.get("name")), pattern),
                                cb.like(cb.lower(root.get("notes")), pattern),
                                cb.like(cb.lower(root.get("address")), pattern),
                                cb.like(cb.lower(root.get("streetNumber")), pattern),
                                cb.like(cb.lower(root.get("postalCode")), pattern)
                        )
                );
            }
            if (filters.getTags() != null && !filters.getTags().isEmpty()) {
                Join<FavoritePlace, PlaceTag> tagsJoin = root.join("tags");
                predicates.add(tagsJoin.in(filters.getTags()));
                query.distinct(true);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
