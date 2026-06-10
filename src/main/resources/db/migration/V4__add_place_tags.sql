CREATE TABLE favorite_place_tags (
    place_id BIGINT NOT NULL,
    tag_order INT NOT NULL,
    tag VARCHAR(50) NOT NULL,
    CONSTRAINT pk_favorite_place_tags PRIMARY KEY (place_id, tag_order),
    CONSTRAINT fk_favorite_place_tags_place FOREIGN KEY (place_id) REFERENCES favorite_places(id) ON DELETE CASCADE
);

CREATE INDEX idx_favorite_place_tags_tag ON favorite_place_tags(tag);
