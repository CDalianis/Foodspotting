package gr.projectfoodspots.common.exception;

public class ForbiddenException extends AppException {

    public ForbiddenException(String message) {
        super("FORBIDDEN", message);
    }
}
