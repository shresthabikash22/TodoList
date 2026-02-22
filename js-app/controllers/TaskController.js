import express from 'express';
import TaskService from '../services/TaskService.js';
import UserService from '../services/UserService.js';
import { getAllCategories } from '../models/Category.js';
import { getAllStatuses, getStatusByName } from '../models/TaskStatus.js';

const router = express.Router();
const taskService = new TaskService();
const userService = new UserService();

// Middleware to handle session messages
router.use((req, res, next) => {
    res.locals.successMessage = req.session?.successMessage || null;
    res.locals.errorMessage = req.session?.errorMessage || null;
    req.session.successMessage = null;
    req.session.errorMessage = null;
    next();
});

// Dashboard - Home page
router.get('/', async (req, res) => {
    try {
        const tasks = await taskService.getAllTasks();
        const users = await userService.getAllUsers();

        // Calculate stats
        const totalCount = tasks.length;
        const pendingCount = tasks.filter(t => t.status.name === 'PENDING').length;
        const inProgressCount = tasks.filter(t => t.status.name === 'IN_PROGRESS').length;
        const completedCount = tasks.filter(t => t.status.name === 'COMPLETED').length;
        const blockedCount = tasks.filter(t => t.status.name === 'BLOCKED').length;
        const cancelledCount = tasks.filter(t => t.status.name === 'CANCELLED').length;

        res.render('dashboard', {
            tasks,
            users,
            categories: getAllCategories(),
            statuses: getAllStatuses(),
            filterUser: null,
            totalCount,
            pendingCount,
            inProgressCount,
            completedCount,
            blockedCount,
            cancelledCount
        });
    } catch (error) {
        res.render('dashboard', {
            tasks: [],
            users: [],
            categories: getAllCategories(),
            statuses: getAllStatuses(),
            filterUser: null,
            totalCount: 0,
            pendingCount: 0,
            inProgressCount: 0,
            completedCount: 0,
            blockedCount: 0,
            cancelledCount: 0,
            errorMessage: error.message
        });
    }
});

// Show add task form
router.get('/tasks/new', async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.render('form', {
            users,
            categories: getAllCategories()
        });
    } catch (error) {
        res.redirect('/');
    }
});

// Add task
router.post('/tasks/add', async (req, res) => {
    try {
        const { title, description, category, assignedUserId } = req.body;
        await taskService.createTask(title, description, category, assignedUserId);
        req.session.successMessage = `Task '${title}' added successfully.`;
    } catch (error) {
        req.session.errorMessage = error.message;
    }
    res.redirect('/');
});

// Delete task
router.post('/tasks/:id/delete', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await taskService.deleteTask(id);
        if (deleted) {
            req.session.successMessage = 'Task deleted successfully.';
        } else {
            req.session.errorMessage = 'Task not found.';
        }
    } catch (error) {
        req.session.errorMessage = error.message;
    }
    res.redirect('/');
});

// Update task status
router.post('/tasks/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updated = await taskService.updateTaskStatus(id, status);

        if (updated) {
            const statusObj = getStatusByName(status);
            req.session.successMessage = `Status updated to: ${statusObj.displayName}`;
        } else {
            req.session.errorMessage = `Invalid transition to '${status}'. Check the allowed status flow.`;
        }
    } catch (error) {
        req.session.errorMessage = error.message;
    }
    res.redirect('/');
});

// Show edit form
router.get('/tasks/:id/edit', async (req, res) => {
    try {
        const { id } = req.params;
        const task = await taskService.getTaskById(id);
        if (!task) {
            return res.redirect('/');
        }

        const users = await userService.getAllUsers();
        res.render('editForm', {
            task,
            users,
            categories: getAllCategories(),
            statuses: getAllStatuses()
        });
    } catch (error) {
        res.redirect('/');
    }
});

// Update task
router.post('/tasks/:id/update', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category, assignedUserId } = req.body;

        const task = await taskService.getTaskById(id);
        if (!task) {
            req.session.errorMessage = 'Task not found.';
            return res.redirect('/');
        }

        task.setTitle(title);
        task.setDescription(description);
        task.setCategory(category);
        task.setAssignedUserId(assignedUserId);

        await taskService.updateTask(task);
        req.session.successMessage = 'Task updated successfully.';
    } catch (error) {
        req.session.errorMessage = error.message;
    }
    res.redirect('/');
});

// Filter by user
router.get('/tasks/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const tasks = await taskService.getTasksByUser(userId);
        const users = await userService.getAllUsers();
        const user = await userService.getUserById(userId);

        const completedCount = tasks.filter(t => t.status.name === 'COMPLETED').length;
        const inProgressCount = tasks.filter(t => t.status.name === 'IN_PROGRESS').length;
        const pendingCount = tasks.filter(t => t.status.name === 'PENDING').length;
        const blockedCount = tasks.filter(t => t.status.name === 'BLOCKED').length;

        res.render('dashboard', {
            tasks,
            users,
            categories: getAllCategories(),
            statuses: getAllStatuses(),
            filterUser: user,
            totalCount: tasks.length,
            completedCount,
            inProgressCount,
            pendingCount,
            blockedCount,
            cancelledCount: 0
        });
    } catch (error) {
        res.redirect('/');
    }
});

export default router;