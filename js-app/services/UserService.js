import UserRepository from '../repositories/UserRepository.js';
import User from '../models/User.js';

class UserService {
    constructor() {
        this.userRepository = new UserRepository();
    }

    async createUser(username) {
        if (!username || username.trim() === '') {
            throw new Error('Username cannot be empty');
        }

        const exists = await this.userRepository.existsByUsername(username);
        if (exists) {
            throw new Error(`Username already exists: ${username}`);
        }

        const user = new User(username.trim());
        return await this.userRepository.save(user);
    }

    async deleteUser(id) {
        const user = await this.userRepository.findById(id);
        if (user && user.getTaskCount() > 0) {
            throw new Error('Cannot delete user with assigned tasks. Reassign or delete their tasks first.');
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
        await this.userRepository.clear();
    }
}

export default UserService;