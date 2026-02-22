import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

/*
 * JAVASCRIPT CONCURRENCY NOTE:
 *
 * Node.js is single-threaded. Only one operation runs at a time on these
 * Maps — no locks or synchronization needed. This contrasts directly with
 * the Java implementation which uses ReentrantLock on every write.
 *
 * The async/await here is for file I/O only, not for thread safety.
 */

// Module-level Maps — one instance shared for the entire process lifetime.
// usersById:       id → User
// usersByUsername: username → User  (for fast duplicate username checks)
const usersById = new Map();
const usersByUsername = new Map();
let loaded = false;

async function ensureLoaded() {
    if (loaded) return;
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        const data = await fs.readFile(USERS_FILE, 'utf8');
        const usersArray = JSON.parse(data);
        usersArray.forEach(userData => {
            const user = User.fromJSON(userData);
            usersById.set(user.id, user);
            usersByUsername.set(user.username.toLowerCase(), user);
        });
        console.log(`UserRepository: loaded ${usersById.size} users from disk.`);
    } catch {
        // File doesn't exist yet — start empty
    }
    loaded = true;
}

async function persistToDisk() {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const usersArray = Array.from(usersById.values()).map(u => u.toJSON());
    await fs.writeFile(USERS_FILE, JSON.stringify(usersArray, null, 2));
}

class UserRepository {

    async save(user) {
        await ensureLoaded();
        // If username changed, remove old username key
        const existing = usersById.get(user.id);
        if (existing && existing.username !== user.username) {
            usersByUsername.delete(existing.username.toLowerCase());
        }
        usersById.set(user.id, user);
        usersByUsername.set(user.username.toLowerCase(), user);
        await persistToDisk();
        return user;
    }

    async findById(id) {
        await ensureLoaded();
        return usersById.get(id) || null;
    }

    async findByUsername(username) {
        await ensureLoaded();
        return usersByUsername.get(username.toLowerCase()) || null;
    }

    async findAll() {
        await ensureLoaded();
        return Array.from(usersById.values());
    }

    async exists(id) {
        await ensureLoaded();
        return usersById.has(id);
    }

    async existsByUsername(username) {
        await ensureLoaded();
        return usersByUsername.has(username.toLowerCase());
    }

    async deleteById(id) {
        await ensureLoaded();
        const user = usersById.get(id);
        if (!user) return false;
        usersById.delete(id);
        usersByUsername.delete(user.username.toLowerCase());
        await persistToDisk();
        return true;
    }

    async count() {
        await ensureLoaded();
        return usersById.size;
    }

    async clear() {
        await ensureLoaded();
        usersById.clear();
        usersByUsername.clear();
        await persistToDisk();
    }
}

export default UserRepository;