package gr.projectfoodspots.common.exception;

public class EntityNotFoundException extends AppException {

    public EntityNotFoundException(String entity, String identifier) {
        super(entity.toUpperCase() + "_NOT_FOUND", entity + " not found for: " + identifier);
    }
}
