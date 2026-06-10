ALTER TABLE favorite_places
    ADD COLUMN street_number VARCHAR(20) NULL AFTER address,
    ADD COLUMN postal_code VARCHAR(20) NULL AFTER street_number;

CREATE INDEX idx_favorite_places_postal_code ON favorite_places(postal_code);
