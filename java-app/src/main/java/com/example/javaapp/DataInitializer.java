package com.example.javaapp;

import com.example.javaapp.model.Category;
import com.example.javaapp.model.TaskStatus;
import com.example.javaapp.model.User;
import com.example.javaapp.model.Task;
import com.example.javaapp.service.TaskService;
import com.example.javaapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * DataInitializer — Seeds the in-memory store with sample data on startup.
 *
 * This replaces the console-printing ConcurrencyDemo with browser-ready data.
 * When the app starts, two users and four tasks are pre-loaded so the dashboard
 * is not empty on first visit.
 *
 * The concurrency demo is now done by opening two browsers simultaneously
 * and submitting status changes on the same task at the same time.
 * The ReentrantLock in TaskService handles the thread contention automatically.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final UserService userService;
    private final TaskService taskService;

    @Autowired
    public DataInitializer(UserService userService, TaskService taskService) {
        this.userService = userService;
        this.taskService = taskService;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("\n========================================");
        System.out.println("Collaborative To-Do List — Java");
        System.out.println("Spring Boot + Thymeleaf + ConcurrentHashMap");
        System.out.println("========================================");
        System.out.println("Seeding initial data...");

        // Create two default users
        User alice = userService.createUser("Alice");
        User bob   = userService.createUser("Bob");

        System.out.println("Created users: Alice (" + alice.getId().substring(0, 8) + "...) " +
                "and Bob (" + bob.getId().substring(0, 8) + "...)");

        // Create sample tasks across all categories
        Task t1 = taskService.createTask(
                "Complete project report",
                "Finish the quarterly report for team review",
                Category.WORK,
                alice.getId()
        );

        Task t2 = taskService.createTask(
                "Fix production bug",
                "Critical issue affecting the checkout process",
                Category.URGENT,
                bob.getId()
        );

        Task t3 = taskService.createTask(
                "Buy birthday gift",
                "Get something nice before the weekend",
                Category.PERSONAL,
                alice.getId()
        );

        Task t4 = taskService.createTask(
                "Weekly team sync",
                "Prepare agenda and meeting notes",
                Category.WORK,
                bob.getId()
        );

        // Move one task to IN_PROGRESS to show status transitions
        taskService.updateTaskStatus(t1.getId(), TaskStatus.IN_PROGRESS);

        System.out.println("Created " + taskService.getTaskCount() + " sample tasks.");
        System.out.println("\nApp running at: http://localhost:8080");
        System.out.println("Open in two browsers to test ReentrantLock concurrency.");
        System.out.println("========================================\n");
    }
}