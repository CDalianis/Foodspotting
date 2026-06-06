package gr.projectfoodspots.common.exception;

public class InvalidArgumentException extends AppException {

    public InvalidArgumentException(String message) {
        super("INVALID_ARGUMENT", message);
    }
}
