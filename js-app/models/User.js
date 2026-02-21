import { v4 as uuidv4 } from 'uuid';

class User {
    constructor(username) {
        if (!username || username.trim() === '') {
            throw new Error('Username cannot be empty');
        }

        this.id = uuidv4();
        this.username = username.trim();
        this.taskIds = [];
    }

    addTask(taskId) {
        if (!this.taskIds.includes(taskId)) {
            this.taskIds.push(taskId);
            return true;
        }
        return false;
    }

    removeTask(taskId) {
        const index = this.taskIds.indexOf(taskId);
        if (index !== -1) {
            this.taskIds.splice(index, 1);
            return true;
        }
        return false;
    }

    getTaskCount() {
        return this.taskIds.length;
    }

    // For JSON serialization
    toJSON() {
        return {
            id: this.id,
            username: this.username,
            taskIds: [...this.taskIds]
        };
    }

    // Create from stored data
    static fromJSON(data) {
        const user = new User(data.username);
        user.id = data.id;
        user.taskIds = [...data.taskIds];
        return user;
    }

    toString() {
        return `User{id='${this.id.substring(0, 8)}...', username='${this.username}', taskCount=${this.taskIds.length}}`;
    }
}

export default User;