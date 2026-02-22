import UserService from '../services/UserService.js';
import TaskService from '../services/TaskService.js';
import { Category } from '../models/Category.js';
import { TaskStatus } from '../models/TaskStatus.js';

const userService = new UserService();
const taskService = new TaskService();
let initialized = false;

export async function initializeData() {
    if (initialized) return;

    console.log('\n========================================');
    console.log('Seeding initial data...');

    try {
        // FORCE CLEAN START - Clear existing data
        console.log('Clearing existing data...');
        await userService.clearAllUsers();
        await taskService.clearAllTasks();

        // Verify clean state
        const userCount = await userService.getUserCount();
        console.log(`📊 User count after clean: ${userCount}`);

        // Create users
        const alice = await userService.createUser('Alice');
        const bob   = await userService.createUser('Bob');
        console.log(`✓ Created users: Alice, Bob`);

        // CONCURRENT TASK CREATION via Promise.all
        console.log('\n--- Concurrent task creation (Promise.all) ---');
        console.time('concurrent-create');

        const [t1, t2, t3, t4] = await Promise.all([
            taskService.createTask(
                'Complete project report',
                'Finish the quarterly report for team review',
                Category.WORK,
                alice.id
            ),
            taskService.createTask(
                'Fix production bug',
                'Critical issue affecting the checkout process',
                Category.URGENT,
                bob.id
            ),
            taskService.createTask(
                'Buy birthday gift',
                'Get something nice before the weekend',
                Category.PERSONAL,
                alice.id
            ),
            taskService.createTask(
                'Weekly team sync',
                'Prepare agenda and meeting notes',
                Category.WORK,
                bob.id
            ),
        ]);

        console.timeEnd('concurrent-create');
        console.log(`✓ 4 tasks created concurrently`);

        // ── CONCURRENT STATUS UPDATES on the same task ────────────────
        console.log('\n--- Concurrent status updates on same task ---');
        console.log(`Firing two status updates on task "${t1.title}" simultaneously...`);

        const [result1, result2] = await Promise.all([
            taskService.updateTaskStatus(t1.id, TaskStatus.IN_PROGRESS),
            taskService.updateTaskStatus(t1.id, TaskStatus.BLOCKED),
        ]);

        const finalTask = await taskService.getTaskById(t1.id);
        console.log(`Update 1 (→ IN_PROGRESS): ${result1 ? 'applied' : 'rejected'}`);
        console.log(`Update 2 (→ BLOCKED):     ${result2 ? 'applied' : 'rejected'}`);
        console.log(`Final status: ${finalTask.status.name}`);

        // ── VERIFY DATA WAS SAVED ────────────────────────────────────
        console.log('\n--- Verifying data persistence ---');
        const savedTasks = await taskService.getAllTasks();
        const savedUsers = await userService.getAllUsers();
        console.log(`📊 Tasks in database: ${savedTasks.length}`);
        console.log(`📊 Users in database: ${savedUsers.length}`);

        // Log each task's status
        console.log('\n📋 Current task statuses:');
        for (const task of savedTasks) {
            const user = savedUsers.find(u => u.id === task.assignedUserId);
            console.log(`  - ${task.title}: ${task.status.name} (assigned to: ${user?.username})`);
        }

        initialized = true;

    } catch (error) {
        console.error('Error seeding data:', error.message);
        console.error(error.stack);
    }
}