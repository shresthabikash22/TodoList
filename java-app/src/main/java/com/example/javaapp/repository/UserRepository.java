package com.example.javaapp.repository;

import com.example.javaapp.model.User;
import org.springframework.stereotype.Repository;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class UserRepository {
    private final ConcurrentHashMap<String, User> usersById = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> userIdByUsername = new ConcurrentHashMap<>();

    public User save(User user) {
        usersById.put(user.getId(), user);
        userIdByUsername.put(user.getUsername().toLowerCase(), user.getId());
        return user;
    }

    public Optional<User> findById(String id) {
        return Optional.ofNullable(usersById.get(id));
    }

    public Optional<User> findByUsername(String username) {
        String id = userIdByUsername.get(username.toLowerCase());
        return id != null ? findById(id) : Optional.empty();
    }

    public List<User> findAll() {
        return new CopyOnWriteArrayList<>(usersById.values());
    }

    public boolean deleteById(String id) {
        User user = usersById.remove(id);
        if (user != null) {
            userIdByUsername.remove(user.getUsername().toLowerCase());
            return true;
        }
        return false;
    }

    public boolean exists(String id) {
        return usersById.containsKey(id);
    }

    public boolean existsByUsername(String username) {
        return userIdByUsername.containsKey(username.toLowerCase());
    }

    public long count() {
        return usersById.size();
    }

    public void clear() {
        usersById.clear();
        userIdByUsername.clear();
    }
}