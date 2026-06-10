INSERT INTO roles (name, description)
VALUES
    ('ROLE_USER', 'Regular application user'),
    ('ROLE_ADMIN', 'Application administrator');

INSERT INTO capabilities (name, description)
VALUES
    ('PLACE_CREATE', 'Create favorite places'),
    ('PLACE_VIEW_OWN', 'View own favorite places'),
    ('PLACE_UPDATE_OWN', 'Update own favorite places'),
    ('PLACE_DELETE_OWN', 'Delete own favorite places'),
    ('PLACE_VIEW_ALL', 'View all favorite places'),
    ('PLACE_DELETE_ANY', 'Delete any favorite place');

INSERT INTO roles_capabilities (role_id, capability_id)
SELECT r.id, c.id
FROM roles r
JOIN capabilities c
WHERE r.name = 'ROLE_USER'
  AND c.name IN ('PLACE_CREATE', 'PLACE_VIEW_OWN', 'PLACE_UPDATE_OWN', 'PLACE_DELETE_OWN');

INSERT INTO roles_capabilities (role_id, capability_id)
SELECT r.id, c.id
FROM roles r
JOIN capabilities c
WHERE r.name = 'ROLE_ADMIN';
