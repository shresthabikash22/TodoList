package com.example.javaapp.model;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class User {
    private final String id;
    private final String username;
    private final List<String> taskIds;

    public User(String username) {
        this.id = UUID.randomUUID().toString();
        this.username = username;
        this.taskIds = new ArrayList<>();
    }

    public String getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public List<String> getTaskIds() {
        return new ArrayList<>(taskIds);  // Return defensive copy
    }

    public void addTask(String taskId) {
        if (!taskIds.contains(taskId)) {
            taskIds.add(taskId);
        }
    }

    public void removeTask(String taskId) {
        taskIds.remove(taskId);
    }

    public int getTaskCount() {
        return taskIds.size();
    }

    @Override
    public String toString() {
        return String.format("User{id='%s', username='%s', taskCount=%d}",
                id, username, taskIds.size());
    }
}