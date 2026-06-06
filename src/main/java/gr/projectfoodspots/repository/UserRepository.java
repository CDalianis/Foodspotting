package gr.projectfoodspots.repository;

import gr.projectfoodspots.model.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUuid(UUID uuid);

    Optional<User> findByUsername(String username);

    @Query("""
            SELECT u FROM User u
            JOIN FETCH u.role r
            LEFT JOIN FETCH r.capabilities
            WHERE u.username = :username
            """)
    Optional<User> findByUsernameWithRoleAndCapabilities(@Param("username") String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}
