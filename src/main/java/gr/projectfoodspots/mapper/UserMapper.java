package gr.projectfoodspots.mapper;

import gr.projectfoodspots.model.User;
import gr.projectfoodspots.dto.UserReadDTO;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserReadDTO toReadDTO(User user) {
        return new UserReadDTO(
                user.getUuid(),
                user.getUsername(),
                user.getEmail(),
                user.isActive(),
                user.getRole().getName()
        );
    }
}
