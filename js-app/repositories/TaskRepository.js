import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Task from '../models/Task.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

/*
 * JAVASCRIPT CONCURRENCY NOTE:
 *
 * Unlike Java, Node.js is single-threaded with an event loop.
 * Only one operation runs at a time on this Map — no Mutex or
 * ReentrantLock is needed. The async/await here is purely for
 * file I/O (disk operations), not for thread safety.
 *
 * The module-level Map is the in-memory store — equivalent to
 * Java's ConcurrentHashMap, but without needing "Concurrent"
 * because JS has no parallel threads.
 *
 * CONTRAST WITH JAVA:
 *   Java  → ConcurrentHashMap + ReentrantLock in TaskService
 *   JS    → plain Map + no lock (event loop prevents races)
 */

// Module-level Map — one instance for the entire process lifetime.
// Never recreated on each request — this is the fix for the slowness.
const tasks = new Map();
let loaded = false;

async function ensureLoaded() {
    if (loaded) return; // Already in memory — skip file read entirely
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        const data = await fs.readFile(TASKS_FILE, 'utf8');
        const tasksArray = JSON.parse(data);
        tasksArray.forEach(taskData => {
            const task = Task.fromJSON(taskData);
            tasks.set(task.id, task);
        });
        console.log(`TaskRepository: loaded ${tasks.size} tasks from disk.`);
    } catch {
        // File doesn't exist yet — start with empty Map
    }
    loaded = true;
}

async function persistToDisk() {
    // Called only after mutations. Never called on reads.
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tasksArray = Array.from(tasks.values()).map(t => t.toJSON());
    await fs.writeFile(TASKS_FILE, JSON.stringify(tasksArray, null, 2));
}

class TaskRepository {

    async save(task) {
        await ensureLoaded();
        tasks.set(task.id, task);
        await persistToDisk();
        return task;
    }

    async findById(id) {
        await ensureLoaded();
        return tasks.get(id) || null;
    }

    async findAll() {
        await ensureLoaded();
        return Array.from(tasks.values());
    }

    async findByUserId(userId) {
        await ensureLoaded();
        return Array.from(tasks.values())
            .filter(task => task.assignedUserId === userId);
    }

    async findByCategory(category) {
        await ensureLoaded();
        const categoryName = typeof category === 'string' ? category : category.name;
        return Array.from(tasks.values())
            .filter(task => task.category.name === categoryName);
    }

    async findByStatus(status) {
        await ensureLoaded();
        const statusName = typeof status === 'string' ? status : status.name;
        return Array.from(tasks.values())
            .filter(task => task.status.name === statusName);
    }

    async deleteById(id) {
        await ensureLoaded();
        const deleted = tasks.delete(id);
        if (deleted) await persistToDisk();
        return deleted;
    }

    async exists(id) {
        await ensureLoaded();
        return tasks.has(id);
    }

    async count() {
        await ensureLoaded();
        return tasks.size;
    }

    async clear() {
        await ensureLoaded();
        tasks.clear();
        await persistToDisk();
    }
}

export default TaskRepository;