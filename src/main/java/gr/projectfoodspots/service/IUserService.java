package gr.projectfoodspots.service;

import gr.projectfoodspots.dto.RegisterRequestDTO;
import gr.projectfoodspots.dto.UserReadDTO;
import java.util.UUID;

public interface IUserService {

    UserReadDTO register(RegisterRequestDTO request);

    UserReadDTO getByUuid(UUID userUuid);

    UserReadDTO getByUsername(String username);
}
