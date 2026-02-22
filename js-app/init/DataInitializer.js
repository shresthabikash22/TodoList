import UserService from '../services/UserService.js';
import TaskService from '../services/TaskService.js';
import { Category } from '../models/Category.js';
import { TaskStatus } from '../models/TaskStatus.js';

const userService = new UserService();
const taskService = new TaskService();

export async function initializeData() {
    console.log('\n========================================');
    console.log('Seeding initial data...');

    try {
        // Clear existing data
        await userService.clearAllUsers();
        await taskService.clearAllTasks();

        // Create two default users
        const alice = await userService.createUser('Alice');
        const bob = await userService.createUser('Bob');

        console.log(`Created users: Alice (${alice.id.substring(0, 8)}...) and Bob (${bob.id.substring(0, 8)}...)`);

        // Create sample tasks
        const t1 = await taskService.createTask(
            'Complete project report',
            'Finish the quarterly report for team review',
            Category.WORK,
            alice.id
        );

        const t2 = await taskService.createTask(
            'Fix production bug',
            'Critical issue affecting the checkout process',
            Category.URGENT,
            bob.id
        );

        const t3 = await taskService.createTask(
            'Buy birthday gift',
            'Get something nice before the weekend',
            Category.PERSONAL,
            alice.id
        );

        const t4 = await taskService.createTask(
            'Weekly team sync',
            'Prepare agenda and meeting notes',
            Category.WORK,
            bob.id
        );

        // Move one task to IN_PROGRESS
        await taskService.updateTaskStatus(t1.id, TaskStatus.IN_PROGRESS);

        const taskCount = await taskService.getTaskCount();
        console.log(`Created ${taskCount} sample tasks.`);
        console.log('========================================\n');
    } catch (error) {
        console.error('Error seeding data:', error.message);
    }
}