package gr.projectfoodspots.repository;

import gr.projectfoodspots.model.FavoritePlace;
import gr.projectfoodspots.model.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface FavoritePlaceRepository extends JpaRepository<FavoritePlace, Long>, JpaSpecificationExecutor<FavoritePlace> {

    Optional<FavoritePlace> findByUuid(UUID uuid);

    Optional<FavoritePlace> findByUuidAndUser(UUID uuid, User user);

    Page<FavoritePlace> findAllByUserAndDeletedFalse(User user, Pageable pageable);

    boolean existsByUuidAndUser_Uuid(UUID uuid, UUID userUuid);
}
