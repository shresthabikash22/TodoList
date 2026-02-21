package com.example.javaapp.model;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

public class Task {
    private final String id;
    private String title;
    private String description;
    private Category category;
    private TaskStatus status;
    private final String assignedUserId;
    private final LocalDateTime createdDate;
    private LocalDateTime completedDate;

    public Task(String title, String description, Category category, String assignedUserId) {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Title cannot be empty");
        }
        if (category == null) {
            throw new IllegalArgumentException("Category cannot be null");
        }
        if (assignedUserId == null || assignedUserId.trim().isEmpty()) {
            throw new IllegalArgumentException("Assigned user ID cannot be empty");
        }

        this.id = UUID.randomUUID().toString();
        this.title = title;
        this.description = description != null ? description : "";
        this.category = category;
        this.status = TaskStatus.PENDING;
        this.assignedUserId = assignedUserId;
        this.createdDate = LocalDateTime.now();
        this.completedDate = null;
    }

    // Getters
    public String getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public Category getCategory() {
        return category;
    }

    public TaskStatus getStatus() {
        return status;
    }

    public String getAssignedUserId() {
        return assignedUserId;
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
    }

    public LocalDateTime getCompletedDate() {
        return completedDate;
    }

    public String getFormattedCreatedDate() {
        return createdDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }

    // Setters with validation
    public void setTitle(String title) {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Title cannot be empty");
        }
        this.title = title;
    }

    public void setDescription(String description) {
        this.description = description != null ? description : "";
    }

    public void setCategory(Category category) {
        if (category == null) {
            throw new IllegalArgumentException("Category cannot be null");
        }
        this.category = category;
    }

    public boolean setStatus(TaskStatus newStatus) {
        if (newStatus == null) {
            throw new IllegalArgumentException("Status cannot be null");
        }

        if (status.canTransitionTo(newStatus)) {
            this.status = newStatus;
            if (newStatus == TaskStatus.COMPLETED) {
                this.completedDate = LocalDateTime.now();
            }
            return true;
        }
        return false;
    }

    public boolean isCompleted() {
        return status == TaskStatus.COMPLETED;
    }

    @Override
    public String toString() {
        return String.format("Task{id='%s', title='%s', category=%s, status=%s, assignedTo='%s'}",
                id.substring(0, 8) + "...", title, category, status, assignedUserId.substring(0, 8) + "...");
    }
}