import { v4 as uuidv4 } from 'uuid';
import { Category, getCategoryByName } from './Category.js';
import { TaskStatus, getStatusByName, canTransitionTo } from './TaskStatus.js';

class Task {
    constructor(title, description, category, assignedUserId) {
        // Validation
        if (!title || title.trim() === '') {
            throw new Error('Title cannot be empty');
        }
        if (!category) {
            throw new Error('Category cannot be null');
        }
        if (!assignedUserId || assignedUserId.trim() === '') {
            throw new Error('Assigned user ID cannot be empty');
        }

        this.id = uuidv4();
        this.title = title;
        this.description = description || '';
        this.category = typeof category === 'string' ? getCategoryByName(category) : category;
        this.status = TaskStatus.PENDING;
        this.assignedUserId = assignedUserId;
        this.createdDate = new Date().toISOString();
        this.completedDate = null;
    }

    // Status update with transition validation
    setStatus(newStatus) {
        if (!newStatus) {
            throw new Error('Status cannot be null');
        }

        const statusObj = typeof newStatus === 'string' ? getStatusByName(newStatus) : newStatus;

        if (canTransitionTo(this.status, statusObj)) {
            this.status = statusObj;
            if (statusObj === TaskStatus.COMPLETED) {
                this.completedDate = new Date().toISOString();
            }
            return true;
        }
        return false;
    }

    isCompleted() {
        return this.status === TaskStatus.COMPLETED;
    }

    // Getters
    getCategoryDisplayName() {
        return this.category.displayName;
    }

    getStatusDisplayName() {
        return this.status.displayName;
    }

    getFormattedCreatedDate() {
        const date = new Date(this.createdDate);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Setters with validation
    setTitle(title) {
        if (!title || title.trim() === '') {
            throw new Error('Title cannot be empty');
        }
        this.title = title;
    }

    setDescription(description) {
        this.description = description || '';
    }

    setCategory(category) {
        if (!category) {
            throw new Error('Category cannot be null');
        }
        this.category = typeof category === 'string' ? getCategoryByName(category) : category;
    }

    setAssignedUserId(assignedUserId) {
        this.assignedUserId = assignedUserId;
    }

    // For JSON serialization
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            category: this.category.name,
            status: this.status.name,
            assignedUserId: this.assignedUserId,
            createdDate: this.createdDate,
            completedDate: this.completedDate
        };
    }

    // Create from stored data
    static fromJSON(data) {
        const task = new Task(
            data.title,
            data.description,
            getCategoryByName(data.category),
            data.assignedUserId
        );
        task.id = data.id;
        task.status = getStatusByName(data.status);
        task.createdDate = data.createdDate;
        task.completedDate = data.completedDate;
        return task;
    }

    toString() {
        return `Task{id='${this.id.substring(0, 8)}...', title='${this.title}', category=${this.category.name}, status=${this.status.name}}`;
    }
}

export default Task;