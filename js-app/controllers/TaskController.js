import express from 'express';
import TaskService from '../services/TaskService.js';
import UserService from '../services/UserService.js';
import { getAllCategories } from '../models/Category.js';
import { getAllStatuses, getStatusByName, canTransitionTo } from '../models/TaskStatus.js';

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
        console.log('📊 Dashboard route accessed');
        const tasks = await taskService.getAllTasks();
        console.log(`✅ Found ${tasks.length} tasks`);
        const users = await userService.getAllUsers();
        console.log(`✅ Found ${users.length} users`);

        // Calculate stats
        const totalCount = tasks.length;
        const pendingCount = tasks.filter(t => t.status.name === 'PENDING').length;
        const inProgressCount = tasks.filter(t => t.status.name === 'IN_PROGRESS').length;
        const completedCount = tasks.filter(t => t.status.name === 'COMPLETED').length;
        const blockedCount = tasks.filter(t => t.status.name === 'BLOCKED').length;
        const cancelledCount = tasks.filter(t => t.status.name === 'CANCELLED').length;

        console.log('📊 Stats:', {
            totalCount,
            pendingCount,
            inProgressCount,
            completedCount,
            blockedCount,
            cancelledCount
        });

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
        console.error('❌ Error in dashboard route:', error);
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

// FIXED STATUS ROUTE - with proper error messaging
router.post('/tasks/:id/status', async (req, res) => {
    console.log('\n' + '='.repeat(60));
    console.log('🔴 STATUS UPDATE ATTEMPTED');
    console.log('='.repeat(60));
    console.log('Task ID:', req.params.id);
    console.log('Requested status:', req.body.status);
    console.log('Request body:', req.body);

    try {
        const { id } = req.params;
        const { status } = req.body;

        // Check if status was provided
        if (!status || status === '') {
            console.log('❌ No status selected');
            req.session.errorMessage = 'Please select a status from the dropdown';
            console.log('✅ Session error set:', req.session.errorMessage);
            return res.redirect('/');
        }

        // Get current task
        console.log('Fetching task...');
        const currentTask = await taskService.getTaskById(id);
        if (!currentTask) {
            console.log('❌ Task not found');
            req.session.errorMessage = 'Task not found';
            return res.redirect('/');
        }
        console.log('✅ Task found:', currentTask.title);
        console.log('Current status:', currentTask.status.name);

        // Get status object
        const statusObj = getStatusByName(status);
        console.log('Status object:', statusObj.name);

        // Check if transition is allowed using canTransitionTo from TaskStatus
        const isValid = canTransitionTo(currentTask.status, statusObj);
        console.log('Transition allowed?', isValid ? '✅ YES' : '❌ NO');

        if (!isValid) {
            // This is the key part - setting error message for invalid transition
            req.session.errorMessage = `Invalid transition: Cannot change from "${currentTask.status.displayName}" to "${statusObj.displayName}".`;
            console.log('✅ Session error set:', req.session.errorMessage);
            return res.redirect('/');
        }

        // Perform the update
        console.log('Performing status update...');
        const updated = await taskService.updateTaskStatus(id, status);

        if (updated) {
            req.session.successMessage = `Status updated to: ${statusObj.displayName}`;
            console.log('✅ Success message set:', req.session.successMessage);
        } else {
            req.session.errorMessage = 'Status update failed';
            console.log('❌ Error message set:', req.session.errorMessage);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        req.session.errorMessage = 'Error: ' + error.message;
    }

    console.log('='.repeat(60) + '\n');
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