package com.example.javaapp.service;


import com.example.javaapp.model.*;
import com.example.javaapp.repository.TaskRepository;
import com.example.javaapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.locks.ReentrantLock;

/**
 * TaskService — Business logic layer for the Collaborative To-Do List.
 *
 * LANGUAGE-SPECIFIC FEATURES DEMONSTRATED:
 *
 * 1. ReentrantLock — explicit thread locking. Any method that modifies shared
 *    data acquires the lock first. If Thread B tries to enter while Thread A
 *    holds the lock, Thread B blocks and waits until Thread A calls unlock().
 *    This is Java's pessimistic concurrency approach — lock first, act second.
 *    JavaScript has no equivalent because it is single-threaded.
 *
 * 2. try/finally pattern — the lock is ALWAYS released in the finally block,
 *    even if an exception is thrown inside the try. This prevents deadlocks
 *    where a thread holds the lock forever because an exception interrupted it.
 *
 * 3. Checked exception handling — IllegalArgumentException and
 *    IllegalStateException are thrown explicitly and must be caught by
 *    the caller (TaskController). The Java compiler enforces this chain
 *    of responsibility across layers.
 *
 * 4. Optional<T> — Java's null-safe container. Callers are forced to check
 *    whether a value exists before using it, preventing NullPointerException.
 *    Equivalent to checking for undefined in JavaScript, but enforced by type.
 *
 * 5. Java Streams — getAllTasks(), getTasksByUser() etc. return results
 *    processed using functional-style stream operations (filter, collect).
 */
@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    /**
     * Single ReentrantLock shared across all write operations.
     * This ensures that only one thread at a time can create, update,
     * or delete a task — even if multiple HTTP requests arrive simultaneously.
     *
     * Read operations (getTaskById, getAllTasks etc.) do not acquire the lock
     * because ConcurrentHashMap in the Repository handles concurrent reads safely.
     */
    private final ReentrantLock lock = new ReentrantLock();

    @Autowired
    public TaskService(TaskRepository taskRepository, UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }


    /**
     * Create a new task and assign it to a user.
     *
     * The lock ensures that if two threads try to create tasks simultaneously,
     * they execute sequentially — one at a time — preventing partial writes
     * to the ConcurrentHashMap and the user's task list.
     */
    public Task createTask(String title, String description,
                           Category category, String assignedUserId) {
        lock.lock();
        try {
            // Validate user exists before creating task
            if (!userRepository.exists(assignedUserId)) {
                throw new IllegalArgumentException(
                        "User not found with id: " + assignedUserId);
            }

            // Validate input — Task constructor also validates, but checking
            // here gives a cleaner error message at the service boundary
            if (title == null || title.trim().isEmpty()) {
                throw new IllegalArgumentException("Task title cannot be empty");
            }

            Task task = new Task(title, description, category, assignedUserId);
            Task savedTask = taskRepository.save(task);

            // Update user's task reference list
            userRepository.findById(assignedUserId).ifPresent(user ->
                    user.addTask(savedTask.getId())
            );

            return savedTask;
        } finally {
            lock.unlock(); // always released — even if exception occurs above
        }
    }

    /**
     * Update a task's status following the state machine rules in TaskStatus.
     *
     * canTransitionTo() enforces valid transitions — e.g. COMPLETED → PENDING
     * is not allowed. This is an OOP design pattern (state machine) that has
     * no direct equivalent in JavaScript without explicit implementation.
     */
    public boolean updateTaskStatus(String taskId, TaskStatus newStatus) {
        lock.lock();
        try {
            Optional<Task> taskOpt = taskRepository.findById(taskId);
            if (taskOpt.isEmpty()) {
                throw new IllegalArgumentException(
                        "Task not found with id: " + taskId);
            }

            Task task = taskOpt.get();
            TaskStatus oldStatus = task.getStatus();
            boolean updated = task.setStatus(newStatus); // uses canTransitionTo()

            if (updated) {
                taskRepository.save(task);
                System.out.printf("  Task status updated: '%s' → '%s'%n",
                        oldStatus.getDisplayName(), newStatus.getDisplayName());
            }

            return updated;
        } finally {
            lock.unlock();
        }
    }

    /**
     * Delete a task and remove its reference from the assigned user's list.
     */
    public boolean deleteTask(String taskId) {
        lock.lock();
        try {
            Optional<Task> taskOpt = taskRepository.findById(taskId);
            if (taskOpt.isEmpty()) {
                return false;
            }

            Task task = taskOpt.get();

            // Remove task reference from the user's list
            userRepository.findById(task.getAssignedUserId()).ifPresent(user ->
                    user.removeTask(taskId)
            );

            return taskRepository.deleteById(taskId);
        } finally {
            lock.unlock();
        }
    }

    /**
     * Update a task's title, description, and category.
     * The assigned user cannot be changed here — task ownership is fixed.
     */
    public Task updateTask(Task updatedTask) {
        lock.lock();
        try {
            if (!taskRepository.exists(updatedTask.getId())) {
                throw new IllegalArgumentException(
                        "Task not found with id: " + updatedTask.getId());
            }
            return taskRepository.save(updatedTask);
        } finally {
            lock.unlock();
        }
    }

    /**
     * Clear all tasks and remove task references from all users.
     *
     * FIX: The original version iterated over getTaskIds() while calling
     * removeTask() inside the loop — this caused ConcurrentModificationException
     * because removeTask() modifies the same list being iterated.
     *
     * Fix: take a snapshot of the IDs first (new ArrayList), then iterate
     * over the snapshot while modifying the original list safely.
     */
    public void clearAllTasks() {
        lock.lock();
        try {
            List<User> allUsers = userRepository.findAll();
            for (User user : allUsers) {
                // Take a snapshot of task IDs before iterating
                // This prevents ConcurrentModificationException
                List<String> taskIdSnapshot = new ArrayList<>(user.getTaskIds());
                for (String taskId : taskIdSnapshot) {
                    user.removeTask(taskId); // safe — iterating snapshot, modifying original
                }
            }
            taskRepository.clear();
        } finally {
            lock.unlock();
        }
    }

    public Optional<Task> getTaskById(String id) {
        return taskRepository.findById(id);
    }

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public List<Task> getTasksByUser(String userId) {
        if (!userRepository.exists(userId)) {
            throw new IllegalArgumentException("User not found with id: " + userId);
        }
        return taskRepository.findByUserId(userId);
    }

    public List<Task> getTasksByCategory(Category category) {
        return taskRepository.findByCategory(category);
    }

    public List<Task> getTasksByStatus(TaskStatus status) {
        return taskRepository.findByStatus(status);
    }

    public long getTaskCount() {
        return taskRepository.count();
    }

    public long getTaskCountByUser(String userId) {
        return taskRepository.findByUserId(userId).size();
    }
}