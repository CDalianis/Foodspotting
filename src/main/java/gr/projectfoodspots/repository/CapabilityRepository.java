package gr.projectfoodspots.repository;

import gr.projectfoodspots.model.Capability;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CapabilityRepository extends JpaRepository<Capability, Long> {

    Optional<Capability> findByName(String name);
}
