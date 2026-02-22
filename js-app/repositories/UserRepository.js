import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

class UserRepository {
    constructor() {
        this.users = new Map(); // In-memory cache
        this.usernameToId = new Map(); // For username lookups
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
            const data = await fs.readFile(USERS_FILE, 'utf8');
            const usersArray = JSON.parse(data);
            this.users.clear();
            this.usernameToId.clear();

            usersArray.forEach(userData => {
                const user = User.fromJSON(userData);
                this.users.set(user.id, user);
                this.usernameToId.set(user.username.toLowerCase(), user.id);
            });
        } catch (error) {
            // File doesn't exist yet, start with empty map
            this.users.clear();
            this.usernameToId.clear();
        }
    }

    async saveToFile() {
        await this.ensureDataDir();
        const usersArray = Array.from(this.users.values()).map(user => user.toJSON());
        await fs.writeFile(USERS_FILE, JSON.stringify(usersArray, null, 2));
    }

    async save(user) {
        await this.loadFromFile();
        this.users.set(user.id, user);
        this.usernameToId.set(user.username.toLowerCase(), user.id);
        await this.saveToFile();
        return user;
    }

    async findById(id) {
        await this.loadFromFile();
        return this.users.get(id) || null;
    }

    async findByUsername(username) {
        await this.loadFromFile();
        const id = this.usernameToId.get(username.toLowerCase());
        return id ? this.users.get(id) || null : null;
    }

    async findAll() {
        await this.loadFromFile();
        return Array.from(this.users.values());
    }

    async deleteById(id) {
        await this.loadFromFile();
        const user = this.users.get(id);
        if (user) {
            this.users.delete(id);
            this.usernameToId.delete(user.username.toLowerCase());
            await this.saveToFile();
            return true;
        }
        return false;
    }

    async exists(id) {
        await this.loadFromFile();
        return this.users.has(id);
    }

    async existsByUsername(username) {
        await this.loadFromFile();
        return this.usernameToId.has(username.toLowerCase());
    }

    async count() {
        await this.loadFromFile();
        return this.users.size;
    }

    async clear() {
        this.users.clear();
        this.usernameToId.clear();
        await this.saveToFile();
    }
}

export default UserRepository;