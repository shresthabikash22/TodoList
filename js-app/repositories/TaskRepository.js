import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Task from '../models/Task.js';
import { getCategoryByName } from '../models/Category.js';
import { getStatusByName } from '../models/TaskStatus.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

class TaskRepository {
    constructor() {
        this.tasks = new Map(); // In-memory cache
    }

    async ensureDataDir() {
        try {
            await fs.mkdir(DATA_DIR, { recursive: true });
        } catch (error) {
            console.error('Error creating data directory:', error);
        }
    }

    async loadFromFile() {
        await this.ensureDataDir();
        try {
            const data = await fs.readFile(TASKS_FILE, 'utf8');
            const tasksArray = JSON.parse(data);
            this.tasks.clear();

            tasksArray.forEach(taskData => {
                const task = Task.fromJSON(taskData);
                this.tasks.set(task.id, task);
            });
        } catch (error) {
            // File doesn't exist yet, start with empty map
            this.tasks.clear();
        }
    }

    async saveToFile() {
        await this.ensureDataDir();
        const tasksArray = Array.from(this.tasks.values()).map(task => task.toJSON());
        await fs.writeFile(TASKS_FILE, JSON.stringify(tasksArray, null, 2));
    }

    async save(task) {
        await this.loadFromFile();
        this.tasks.set(task.id, task);
        await this.saveToFile();
        return task;
    }

    async findById(id) {
        await this.loadFromFile();
        return this.tasks.get(id) || null;
    }

    async findAll() {
        await this.loadFromFile();
        return Array.from(this.tasks.values());
    }

    async findByUserId(userId) {
        await this.loadFromFile();
        return Array.from(this.tasks.values())
            .filter(task => task.assignedUserId === userId);
    }

    async findByCategory(category) {
        await this.loadFromFile();
        const categoryName = typeof category === 'string' ? category : category.name;
        return Array.from(this.tasks.values())
            .filter(task => task.category.name === categoryName);
    }

    async findByStatus(status) {
        await this.loadFromFile();
        const statusName = typeof status === 'string' ? status : status.name;
        return Array.from(this.tasks.values())
            .filter(task => task.status.name === statusName);
    }

    async deleteById(id) {
        await this.loadFromFile();
        const deleted = this.tasks.delete(id);
        if (deleted) {
            await this.saveToFile();
        }
        return deleted;
    }

    async exists(id) {
        await this.loadFromFile();
        return this.tasks.has(id);
    }

    async count() {
        await this.loadFromFile();
        return this.tasks.size;
    }

    async clear() {
        this.tasks.clear();
        await this.saveToFile();
    }
}

export default TaskRepository;