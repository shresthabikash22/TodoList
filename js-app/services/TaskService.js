import TaskRepository from '../repositories/TaskRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import Task from '../models/Task.js';
import { getCategoryByName } from '../models/Category.js';
import { getStatusByName } from '../models/TaskStatus.js';

/*
 * TaskService — Business logic for task management.
 *
 * LANGUAGE-SPECIFIC FEATURES DEMONSTRATED:
 *
 * 1. async/await throughout — all operations are non-blocking. While
 *    a file write is in progress, Node.js can handle other requests.
 *    This is cooperative multitasking via the event loop.
 *
 * 2. No ReentrantLock — Java's TaskService uses explicit locking because
 *    multiple OS threads can run simultaneously and corrupt shared state.
 *    Node.js is single-threaded: the event loop ensures only one
 *    callback executes at a time, so no lock is ever needed.
 *
 * 3. Promise.all used by callers (DataInitializer) to fire multiple
 *    service calls concurrently — the async nature of these methods
 *    makes that possible. A synchronous method cannot be parallelized
 *    by Promise.all.
 *
 * 4. Destructuring and spread — used throughout for cleaner code.
 *    JavaScript has no equivalent to Java's final fields or
 *    defensive copies — immutability is a convention, not enforced.
 *
 * 5. typeof checks — JavaScript has no enum type. Category and
 *    TaskStatus are plain objects, so we check typeof to handle
 *    both string names and object references as input.
 */
class TaskService {

    constructor() {
        this.taskRepository = new TaskRepository();
        this.userRepository = new UserRepository();
    }

    // ─────────────────────────────────────────────────────────────────────
    // WRITE OPERATIONS
    // All return Promises — callers can await individually or combine
    // with Promise.all for concurrent execution.
    // ─────────────────────────────────────────────────────────────────────

    async createTask(title, description, category, assignedUserId) {
        if (!title || title.trim() === '') {
            throw new Error('Task title cannot be empty');
        }
        const userExists = await this.userRepository.exists(assignedUserId);
        if (!userExists) {
            throw new Error(`User not found with id: ${assignedUserId}`);
        }

        const categoryObj = typeof category === 'string'
            ? getCategoryByName(category)
            : category;

        const task = new Task(title, description, categoryObj, assignedUserId);
        const savedTask = await this.taskRepository.save(task);

        // Update user's task reference list
        const user = await this.userRepository.findById(assignedUserId);
        if (user) {
            user.addTask(savedTask.id);
            await this.userRepository.save(user);
        }

        return savedTask;
    }

    async updateTaskStatus(taskId, newStatus) {
        const task = await this.taskRepository.findById(taskId);
        if (!task) {
            throw new Error(`Task not found with id: ${taskId}`);
        }

        const statusObj = typeof newStatus === 'string'
            ? getStatusByName(newStatus)
            : newStatus;

        const oldStatus = task.status;
        const updated = task.setStatus(statusObj); // uses canTransitionTo()

        if (updated) {
            await this.taskRepository.save(task);
            console.log(`  Status: '${oldStatus.displayName}' → '${statusObj.displayName}'`);
        }

        return updated;
    }

    async deleteTask(taskId) {
        const task = await this.taskRepository.findById(taskId);
        if (!task) return false;

        // Remove task reference from user
        const user = await this.userRepository.findById(task.assignedUserId);
        if (user) {
            user.removeTask(taskId);
            await this.userRepository.save(user);
        }

        return await this.taskRepository.deleteById(taskId);
    }

    async updateTask(updatedTask) {
        const exists = await this.taskRepository.exists(updatedTask.id);
        if (!exists) {
            throw new Error(`Task not found with id: ${updatedTask.id}`);
        }
        return await this.taskRepository.save(updatedTask);
    }

    async clearAllTasks() {
        const allUsers = await this.userRepository.findAll();
        for (const user of allUsers) {
            const snapshot = [...user.taskIds];
            for (const taskId of snapshot) {
                user.removeTask(taskId);
            }
            await this.userRepository.save(user);
        }
        await this.taskRepository.clear();
    }

    // ─────────────────────────────────────────────────────────────────────
    // READ OPERATIONS
    // These are safe to run concurrently via Promise.all — no writes.
    // ─────────────────────────────────────────────────────────────────────

    async getTaskById(id) {
        return await this.taskRepository.findById(id);
    }

    async getAllTasks() {
        return await this.taskRepository.findAll();
    }

    async getTasksByUser(userId) {
        const userExists = await this.userRepository.exists(userId);
        if (!userExists) {
            throw new Error(`User not found with id: ${userId}`);
        }
        return await this.taskRepository.findByUserId(userId);
    }

    async getTasksByCategory(category) {
        return await this.taskRepository.findByCategory(category);
    }

    async getTasksByStatus(status) {
        return await this.taskRepository.findByStatus(status);
    }

    async getTaskCount() {
        return await this.taskRepository.count();
    }

    async getTaskCountByUser(userId) {
        const tasks = await this.taskRepository.findByUserId(userId);
        return tasks.length;
    }
}

export default TaskService;