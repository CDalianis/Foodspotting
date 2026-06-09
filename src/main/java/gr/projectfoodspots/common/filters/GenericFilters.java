package gr.projectfoodspots.common.filters;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GenericFilters {

    private Integer page = 0;
    private Integer size = 20;
    private String sortBy = "createdAt";
    private String sortDirection = "desc";
}
