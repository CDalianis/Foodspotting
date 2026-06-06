package gr.projectfoodspots.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Setter
@Entity
@Table(
        name = "favorite_places",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_favorite_places_uuid", columnNames = "uuid"),
                @UniqueConstraint(name = "uk_favorite_places_google_place_id", columnNames = "google_place_id")
        }
)
public class FavoritePlace extends AbstractEntity {

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(nullable = false, columnDefinition = "BINARY(16)")
    private UUID uuid = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 11, scale = 8)
    private BigDecimal longitude;

    @Column(length = 300)
    private String address;

    @Column(name = "street_number", length = 20)
    private String streetNumber;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(length = 120)
    private String city;

    @Column(length = 120)
    private String country;

    @Column(name = "google_place_id", length = 255)
    private String googlePlaceId;

    @Column
    private Integer rating;

    @Column(nullable = false)
    private boolean isPublic = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "favorite_place_tags",
            joinColumns = @JoinColumn(name = "place_id")
    )
    @OrderColumn(name = "tag_order")
    @Enumerated(EnumType.STRING)
    @Column(name = "tag", nullable = false, length = 50)
    private List<PlaceTag> tags = new ArrayList<>();
}
