CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_active_deleted ON users(active, deleted);
CREATE INDEX idx_favorite_places_user_id ON favorite_places(user_id);
CREATE INDEX idx_favorite_places_user_deleted ON favorite_places(user_id, deleted);
CREATE INDEX idx_favorite_places_city ON favorite_places(city);
CREATE INDEX idx_favorite_places_lat_lng ON favorite_places(latitude, longitude);
