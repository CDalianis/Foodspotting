package gr.projectfoodspots.security;

import gr.projectfoodspots.model.User;
import gr.projectfoodspots.repository.FavoritePlaceRepository;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service("securityService")
public class SecurityService {

    @Autowired
    private FavoritePlaceRepository favoritePlaceRepository;

    public boolean isOwnPlace(UUID placeUuid, Authentication authentication) {
        User principal = (User) authentication.getPrincipal();
        return favoritePlaceRepository.existsByUuidAndUser_Uuid(placeUuid, principal.getUuid());
    }
}
