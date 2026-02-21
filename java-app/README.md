# Collaborative To-Do List - Java Implementation

A multi-threaded collaborative to-do list application built with Java and Spring Boot, demonstrating key language features for the Advanced Programming Languages course.

## 🚀 Technology Stack

- **Java 17** - Core language
- **Spring Boot 4.0.3** - Application framework
- **Maven** - Dependency management
- **JVM** - Memory management and garbage collection
- **Concurrency**: ReentrantLock, ExecutorService, Thread pools
- **Data Structures**: ConcurrentHashMap, CopyOnWriteArrayList, Streams API

## 🏗️ Architecture

The application follows a layered architecture:
com.example.javaapp/
├── model/ - Data classes (Task, User, enums)
├── repository/ - Thread-safe data storage
├── service/ - Business logic with concurrency control
├── controller/ - HTTP request handlers
└── DataInitiaizer 


## 🔧 Language Features Demonstrated

### 1. Concurrency with ReentrantLock

```java
private final ReentrantLock lock = new ReentrantLock();

public Task createTask(String title, String description, Category category, String assignedUserId) {
    lock.lock();  // Thread acquires lock
    try {
        // Critical section - only one thread executes this at a time
        if (!userRepository.exists(assignedUserId)) {
            throw new IllegalArgumentException("User not found");
        }
        Task task = new Task(title, description, category, assignedUserId);
        return taskRepository.save(task);
    } finally {
        lock.unlock();  // ALWAYS releases lock, even if exception occurs
    }
}