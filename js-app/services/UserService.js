import UserRepository from '../repositories/UserRepository.js';

/*
 * UserService — Business logic for user management.
 *
 * LANGUAGE-SPECIFIC FEATURES DEMONSTRATED:
 *
 * 1. async/await — every method is async because repository operations
 *    involve file I/O. The caller awaits the result without blocking
 *    the event loop. Other requests can be handled while I/O completes.
 *
 * 2. No locking — unlike Java's UserService which uses ReentrantLock,
 *    no synchronization is needed here. Node.js is single-threaded:
 *    only one piece of JavaScript runs at a time, so Map operations
 *    are never truly concurrent.
 *
 * 3. Error throwing with plain Error objects — JavaScript uses
 *    throw new Error('message') where Java uses typed exceptions
 *    (IllegalArgumentException, IllegalStateException). JS has no
 *    checked exceptions — the caller is NOT forced to handle errors
 *    by the compiler. This is a key language difference.
 *
 * 4. Truthy/falsy checks — if (!username) catches both null and
 *    empty string. Java requires explicit null checks and .isEmpty().
 */
class UserService {

    constructor() {
        this.userRepository = new UserRepository();
    }

    async createUser(username) {
        if (!username || username.trim() === '') {
            throw new Error('Username cannot be empty');
        }
        const trimmed = username.trim();
        if (await this.userRepository.existsByUsername(trimmed)) {
            throw new Error(`Username already exists: ${trimmed}`);
        }
        // Import User lazily to avoid circular dependency issues
        const { default: User } = await import('../models/User.js');
        const user = new User(trimmed);
        return await this.userRepository.save(user);
    }

    async deleteUser(id) {
        const user = await this.userRepository.findById(id);
        if (user && user.getTaskCount() > 0) {
            throw new Error('Cannot delete user with assigned tasks. Remove their tasks first.');
        }
        return await this.userRepository.deleteById(id);
    }


    async getUserById(id) {
        return await this.userRepository.findById(id);
    }

    async getUserByUsername(username) {
        return await this.userRepository.findByUsername(username);
    }

    async getAllUsers() {
        return await this.userRepository.findAll();
    }

    async userExists(id) {
        return await this.userRepository.exists(id);
    }

    async getUserCount() {
        return await this.userRepository.count();
    }

    async clearAllUsers() {
        return await this.userRepository.clear();
    }
}

export default UserService;