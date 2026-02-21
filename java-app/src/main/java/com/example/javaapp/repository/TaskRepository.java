package com.example.javaapp.repository;

import com.example.javaapp.model.Task;
import com.example.javaapp.model.Category;
import com.example.javaapp.model.TaskStatus;
import org.springframework.stereotype.Repository;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class TaskRepository {
    private final ConcurrentHashMap<String, Task> tasksById = new ConcurrentHashMap<>();

    public Task save(Task task) {
        tasksById.put(task.getId(), task);
        return task;
    }

    public Optional<Task> findById(String id) {
        return Optional.ofNullable(tasksById.get(id));
    }

    public List<Task> findAll() {
        return new CopyOnWriteArrayList<>(tasksById.values());
    }

    public List<Task> findByUserId(String userId) {
        return tasksById.values().stream()
                .filter(task -> task.getAssignedUserId().equals(userId))
                .collect(Collectors.toCollection(CopyOnWriteArrayList::new));
    }

    public List<Task> findByCategory(Category category) {
        return tasksById.values().stream()
                .filter(task -> task.getCategory() == category)
                .collect(Collectors.toCollection(CopyOnWriteArrayList::new));
    }

    public List<Task> findByStatus(TaskStatus status) {
        return tasksById.values().stream()
                .filter(task -> task.getStatus() == status)
                .collect(Collectors.toCollection(CopyOnWriteArrayList::new));
    }

    public boolean deleteById(String id) {
        return tasksById.remove(id) != null;
    }

    public boolean exists(String id) {
        return tasksById.containsKey(id);
    }

    public long count() {
        return tasksById.size();
    }

    public void clear() {
        tasksById.clear();
    }
}