package gr.projectfoodspots.api;

import gr.projectfoodspots.dto.AuthenticationRequestDTO;
import gr.projectfoodspots.dto.AuthenticationResponseDTO;
import gr.projectfoodspots.authentication.AuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthRestController {


    private final AuthenticationService authenticationService;

public AuthRestController ( AuthenticationService authenticationService)   {
    this.authenticationService = authenticationService;
}
    @PostMapping("/authenticate")
    public ResponseEntity<AuthenticationResponseDTO> authenticate(
            @Valid @RequestBody AuthenticationRequestDTO dto
    ) {
        AuthenticationResponseDTO responseDTO = authenticationService.authenticate(dto);
        return ResponseEntity.ok(responseDTO);
    }
}
