import TaskRepository from '../repositories/TaskRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import Task from '../models/Task.js';
import { getCategoryByName } from '../models/Category.js';
import { getStatusByName } from '../models/TaskStatus.js';


class TaskService {
    constructor() {
        this.taskRepository = new TaskRepository();
        this.userRepository = new UserRepository();
    }

    async createTask(title, description, category, assignedUserId) {
        // Validate user exists
        const userExists = await this.userRepository.exists(assignedUserId);
        if (!userExists) {
            throw new Error(`User not found with id: ${assignedUserId}`);
        }

        // Validate input
        if (!title || title.trim() === '') {
            throw new Error('Task title cannot be empty');
        }

        const categoryObj = typeof category === 'string' ? getCategoryByName(category) : category;
        const task = new Task(title, description, categoryObj, assignedUserId);
        const savedTask = await this.taskRepository.save(task);

        // Update user's task list
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

        const statusObj = typeof newStatus === 'string' ? getStatusByName(newStatus) : newStatus;
        const oldStatus = task.status;
        const updated = task.setStatus(statusObj);

        if (updated) {
            await this.taskRepository.save(task);
            console.log(`  Task status updated: '${oldStatus.displayName}' → '${statusObj.displayName}'`);
        }

        return updated;
    }

    async deleteTask(taskId) {
        const task = await this.taskRepository.findById(taskId);
        if (!task) {
            return false;
        }

        // Remove task reference from user's list
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
            // Take a snapshot of task IDs
            const taskIdSnapshot = [...user.taskIds];
            for (const taskId of taskIdSnapshot) {
                user.removeTask(taskId);
            }
            await this.userRepository.save(user);
        }
        await this.taskRepository.clear();
    }

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