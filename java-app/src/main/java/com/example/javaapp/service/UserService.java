package com.example.javaapp.service;

import com.example.javaapp.model.User;
import com.example.javaapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * UserService — Business logic layer for user management.
 *
 * LANGUAGE-SPECIFIC FEATURES DEMONSTRATED:
 *
 * 1. No ReentrantLock here — user creation and deletion are simple operations.
 *    The ConcurrentHashMap in UserRepository handles concurrent reads and writes
 *    at the data level. The ReentrantLock is reserved for TaskService where
 *    multi-step operations (check user exists → create task → update user list)
 *    must execute as a single atomic unit.
 *
 * 2. Optional<T> — getUserById() and getUserByUsername() return Optional<User>
 *    instead of null. The caller is forced by the type system to handle the
 *    case where the user does not exist, eliminating NullPointerException.
 *
 * 3. IllegalStateException vs IllegalArgumentException — deleteUser() throws
 *    IllegalStateException (not IllegalArgumentException) when a user still
 *    has tasks. Using the correct exception type communicates the reason for
 *    failure more precisely. IllegalArgument = bad input. IllegalState = the
 *    system is in a state that does not allow this operation.
 */
@Service
public class UserService {

    private final UserRepository userRepository;

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }



    public User createUser(String username) {
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username cannot be empty");
        }
        if (userRepository.existsByUsername(username.trim())) {
            throw new IllegalArgumentException(
                    "Username already exists: " + username);
        }
        return userRepository.save(new User(username.trim()));
    }

    /**
     * Delete a user only if they have no assigned tasks.
     * Prevents orphaned tasks remaining in the system.
     */
    public boolean deleteUser(String id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent() && userOpt.get().getTaskCount() > 0) {
            throw new IllegalStateException(
                    "Cannot delete user with assigned tasks. " +
                            "Reassign or delete their tasks first.");
        }
        return userRepository.deleteById(id);
    }

    /**
     * Clear all users from the system.
     */
    public void clearAllUsers() {
        userRepository.clear();
    }


    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public boolean userExists(String id) {
        return userRepository.exists(id);
    }

    public long getUserCount() {
        return userRepository.count();
    }
}