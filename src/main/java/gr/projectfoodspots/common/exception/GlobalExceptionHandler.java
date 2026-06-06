package gr.projectfoodspots.common.exception;

import gr.projectfoodspots.dto.ErrorResponseDTO;
import gr.projectfoodspots.dto.SecurityErrorResponseDTO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AccountExpiredException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.CredentialsExpiredException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import lombok.extern.slf4j.Slf4j;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponseDTO> handleNotFound(EntityNotFoundException ex) {
        log.warn("Entity not found: {}", ex.getMessage());
        return buildResponse(ex.getErrorCode(), ex.getMessage(), HttpStatus.NOT_FOUND, null);
    }

    @ExceptionHandler(EntityAlreadyExistsException.class)
    public ResponseEntity<ErrorResponseDTO> handleAlreadyExists(EntityAlreadyExistsException ex) {
        log.warn("Entity already exists: {}", ex.getMessage());
        return buildResponse(ex.getErrorCode(), ex.getMessage(), HttpStatus.CONFLICT, null);
    }

    @ExceptionHandler(InvalidArgumentException.class)
    public ResponseEntity<ErrorResponseDTO> handleInvalidArgument(InvalidArgumentException ex) {
        log.warn("Invalid argument: {}", ex.getMessage());
        return buildResponse(ex.getErrorCode(), ex.getMessage(), HttpStatus.BAD_REQUEST, null);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponseDTO> handleUnauthorized(UnauthorizedException ex) {
        log.warn("Unauthorized access: {}", ex.getMessage());
        return buildResponse(ex.getErrorCode(), ex.getMessage(), HttpStatus.UNAUTHORIZED, null);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ErrorResponseDTO> handleForbidden(ForbiddenException ex) {
        log.warn("Forbidden access: {}", ex.getMessage());
        return buildResponse(ex.getErrorCode(), ex.getMessage(), HttpStatus.FORBIDDEN, null);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<SecurityErrorResponseDTO> handleAuthenticationException(
            AuthenticationException e,
            HttpServletRequest request
    ) {
        log.warn("Failed login for IP={}", request.getRemoteAddr());

        String errorCode = switch (e) {
            case BadCredentialsException ignored -> "INVALID_CREDENTIALS";
            case DisabledException ignored -> "ACCOUNT_DISABLED";
            case LockedException ignored -> "ACCOUNT_LOCKED";
            case AccountExpiredException ignored -> "ACCOUNT_EXPIRED";
            case CredentialsExpiredException ignored -> "CREDENTIALS_EXPIRED";
            case AuthenticationCredentialsNotFoundException ignored -> "UNAUTHORIZED";
            default -> "AUTHENTICATION_ERROR";
        };

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new SecurityErrorResponseDTO(errorCode, e.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<SecurityErrorResponseDTO> handleAccessDeniedException(AccessDeniedException e) {
        log.warn("Access denied. Message={}", e.getMessage());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(new SecurityErrorResponseDTO("ACCESS_DENIED", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDTO> handleValidation(MethodArgumentNotValidException ex) {
        log.warn("Validation error: {}", ex.getMessage());
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return buildResponse("VALIDATION_ERROR", "Validation failed", HttpStatus.BAD_REQUEST, errors);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponseDTO> handleConstraintViolation(ConstraintViolationException ex) {
        log.warn("Constraint violation: {}", ex.getMessage());
        Map<String, String> errors = new HashMap<>();
        ex.getConstraintViolations().forEach(v -> errors.put(v.getPropertyPath().toString(), v.getMessage()));
        return buildResponse("VALIDATION_ERROR", "Constraint violation", HttpStatus.BAD_REQUEST, errors);
    }

//    @ExceptionHandler(Exception.class)
//    public ResponseEntity<ErrorResponseDTO> handleGeneric(Exception ex) {
//        log.error("Unhandled exception", ex);
//        return buildResponse("INTERNAL_SERVER_ERROR", ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR, null);
//    }

    private ResponseEntity<ErrorResponseDTO> buildResponse(
            String errorCode,
            String message,
            HttpStatus status,
            Map<String, String> validationErrors
    ) {
        ErrorResponseDTO response = new ErrorResponseDTO(
                errorCode,
                message,
                status.value(),
                LocalDateTime.now(),
                validationErrors
        );
        return ResponseEntity.status(status).body(response);
    }
}
