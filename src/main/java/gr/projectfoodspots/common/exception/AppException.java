package gr.projectfoodspots.common.exception;

public abstract class AppException extends RuntimeException {

    private final String errorCode;

    protected AppException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
