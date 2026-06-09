package gr.projectfoodspots.service.impl;

import gr.projectfoodspots.dto.RegisterRequestDTO;
import gr.projectfoodspots.common.exception.EntityAlreadyExistsException;
import gr.projectfoodspots.common.exception.EntityNotFoundException;
import gr.projectfoodspots.mapper.UserMapper;
import gr.projectfoodspots.model.Role;
import gr.projectfoodspots.model.User;
import gr.projectfoodspots.repository.RoleRepository;
import gr.projectfoodspots.repository.UserRepository;
import gr.projectfoodspots.service.IUserService;
import gr.projectfoodspots.dto.UserReadDTO;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements IUserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UserReadDTO register(RegisterRequestDTO request) {
        log.info("Registering new user username={}", request.username());
        if (userRepository.existsByUsername(request.username())) {
            log.warn("Registration rejected, username exists: {}", request.username());
            throw new EntityAlreadyExistsException("User", "username=" + request.username());
        }
        if (userRepository.existsByEmail(request.email())) {
            log.warn("Registration rejected, email exists: {}", request.email());
            throw new EntityAlreadyExistsException("User", "email=" + request.email());
        }

        Role role = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new EntityNotFoundException("Role", "name=ROLE_USER"));

        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(role);

        User saved = userRepository.save(user);
        log.info("User registered successfully username={} uuid={}", saved.getUsername(), saved.getUuid());
        return userMapper.toReadDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public UserReadDTO getByUuid(UUID userUuid) {
        log.debug("Fetching user by uuid={}", userUuid);
        User user = userRepository.findByUuid(userUuid)
                .orElseThrow(() -> new EntityNotFoundException("User", "uuid=" + userUuid));
        return userMapper.toReadDTO(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserReadDTO getByUsername(String username) {
        log.debug("Fetching user by username={}", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User", "username=" + username));
        return userMapper.toReadDTO(user);
    }
}
