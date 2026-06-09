package gr.projectfoodspots.place.filters;

import gr.projectfoodspots.common.filters.GenericFilters;
import gr.projectfoodspots.model.PlaceTag;
import java.util.List;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlaceFilters extends GenericFilters {

    private UUID uuid;
    private String city;
    private String country;
    private Integer minRating;
    private Integer maxRating;
    private String q;
    private Boolean isPublic;
    private List<PlaceTag> tags;
}
