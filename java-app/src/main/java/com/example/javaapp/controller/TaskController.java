package com.example.javaapp.controller;


import com.example.javaapp.model.Category;
import com.example.javaapp.model.Task;
import com.example.javaapp.model.TaskStatus;
import com.example.javaapp.model.User;
import com.example.javaapp.service.TaskService;
import com.example.javaapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;


@Controller
@RequestMapping("/")
public class TaskController {

    private final TaskService taskService;
    private final UserService userService;

    @Autowired
    public TaskController(TaskService taskService, UserService userService) {
        this.taskService = taskService;
        this.userService = userService;
    }


    @GetMapping("/")
    public String dashboard(Model model) {

            List<Task> tasks = taskService.getAllTasks();
            List<User> users = userService.getAllUsers();

            // Stats
            model.addAttribute("totalCount", tasks.size());
            model.addAttribute("pendingCount", (int) tasks.stream().filter(t -> t.getStatus() == TaskStatus.PENDING).count());
            model.addAttribute("inProgressCount", (int) tasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count());
            model.addAttribute("completedCount", (int) tasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count());
            model.addAttribute("blockedCount", (int) tasks.stream().filter(t -> t.getStatus() == TaskStatus.BLOCKED).count());
        model.addAttribute("cancelledCount", (int) tasks.stream().filter(t -> t.getStatus() == TaskStatus.CANCELLED).count());


        // Other model attributes
            model.addAttribute("tasks", tasks);
            model.addAttribute("users", users);
            model.addAttribute("categories", Arrays.asList(Category.values()));
            model.addAttribute("statuses", Arrays.asList(TaskStatus.values()));


            // Optional filter user (null by default)
            model.addAttribute("filterUser", null);

            return "dashboard";
    }

    @PostMapping("/users/add")
    public String addUser(
            @RequestParam String username,
            RedirectAttributes redirectAttributes) {
        try {
            userService.createUser(username);
            redirectAttributes.addFlashAttribute("successMessage",
                    "User '" + username + "' created successfully.");
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/";
    }

    @GetMapping("/tasks/new")
    public String showAddTaskForm(Model model) {
        model.addAttribute("users", userService.getAllUsers());
        model.addAttribute("categories", Category.values());
        return "form"; // → templates/task-form.html
    }

    @PostMapping("/tasks/add")
    public String addTask(
            @RequestParam String title,
            @RequestParam(defaultValue = "") String description,
            @RequestParam String category,
            @RequestParam String assignedUserId,
            RedirectAttributes redirectAttributes) {
        try {
            Category categoryEnum = Category.valueOf(category.toUpperCase());
            taskService.createTask(title, description, categoryEnum, assignedUserId);
            redirectAttributes.addFlashAttribute("successMessage",
                    "Task '" + title + "' added successfully.");
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/";
    }

    @PostMapping("/tasks/{id}/delete")
    public String deleteTask(
            @PathVariable String id,
            RedirectAttributes redirectAttributes) {
        try {
            boolean deleted = taskService.deleteTask(id);
            if (deleted) {
                redirectAttributes.addFlashAttribute("successMessage",
                        "Task deleted successfully.");
            } else {
                redirectAttributes.addFlashAttribute("errorMessage",
                        "Task not found.");
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/";
    }

    @PostMapping("/tasks/{id}/status")
    public String updateStatus(
            @PathVariable String id,
            @RequestParam String status,
            RedirectAttributes redirectAttributes) {
        try {
            // Convert String → TaskStatus enum
            TaskStatus newStatus = TaskStatus.valueOf(
                    status.toUpperCase().replace(" ", "_").replace("-", "_"));

            boolean updated = taskService.updateTaskStatus(id, newStatus);

            if (updated) {
                redirectAttributes.addFlashAttribute("successMessage",
                        "Status updated to: " + newStatus.getDisplayName());
            } else {
                // canTransitionTo() returned false — invalid transition
                redirectAttributes.addFlashAttribute("errorMessage",
                        "Invalid transition to '" + newStatus.getDisplayName() +
                                "'. Check the allowed status flow.");
            }
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/";
    }


    @GetMapping("/tasks/{id}/edit")
    public String showEditForm(@PathVariable String id, Model model) {
        Optional<Task> taskOpt = taskService.getTaskById(id);
        if (taskOpt.isEmpty()) {
            return "redirect:/";
        }
        model.addAttribute("task", taskOpt.get());
        model.addAttribute("users", userService.getAllUsers());
        model.addAttribute("categories", Category.values());
        model.addAttribute("statuses", TaskStatus.values());
        return "editForm"; // → templates/task-edit.html
    }

    @PostMapping("/tasks/{id}/update")
    public String updateTask(
            @PathVariable String id,
            @RequestParam String title,
            @RequestParam(defaultValue = "") String description,
            @RequestParam String category,
            @RequestParam String assignedUserId,
            RedirectAttributes redirectAttributes) {
        try {
            Optional<Task> taskOpt = taskService.getTaskById(id);
            if (taskOpt.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Task not found.");
                return "redirect:/";
            }
            Task task = taskOpt.get();
            task.setTitle(title);
            task.setDescription(description);
            task.setCategory(Category.valueOf(category.toUpperCase()));
            task.setAssignedUserId(assignedUserId);
            taskService.updateTask(task);
            redirectAttributes.addFlashAttribute("successMessage",
                    "Task updated successfully.");
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/";
    }

    @GetMapping("/tasks/user/{userId}")
    public String tasksByUser(@PathVariable String userId, Model model) {
        try {
            List<Task> tasks = taskService.getTasksByUser(userId);
            Optional<User> user = userService.getUserById(userId);

            long completedCount  = tasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count();
            long inProgressCount = tasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
            long pendingCount    = tasks.stream().filter(t -> t.getStatus() == TaskStatus.PENDING).count();
            long blockedCount    = tasks.stream().filter(t -> t.getStatus() == TaskStatus.BLOCKED).count();

            model.addAttribute("tasks", tasks);
            model.addAttribute("users", userService.getAllUsers());
            model.addAttribute("categories", Category.values());
            model.addAttribute("statuses", TaskStatus.values());
            model.addAttribute("filterUser", user.orElse(null));
            model.addAttribute("totalCount", tasks.size());
            model.addAttribute("completedCount", completedCount);
            model.addAttribute("inProgressCount", inProgressCount);
            model.addAttribute("pendingCount", pendingCount);
            model.addAttribute("blockedCount", blockedCount);
        } catch (IllegalArgumentException e) {
            return "redirect:/";
        }
        return "dashboard";
    }
}
