package gr.projectfoodspots.common.exception;

public class EntityAlreadyExistsException extends AppException {

    public EntityAlreadyExistsException(String entity, String identifier) {
        super(entity.toUpperCase() + "_ALREADY_EXISTS", entity + " already exists for: " + identifier);
    }
}
