// Equivalent to Java Enum with transition rules
const TaskStatus = Object.freeze({
    PENDING: { name: 'PENDING', displayName: 'Pending' },
    IN_PROGRESS: { name: 'IN_PROGRESS', displayName: 'In Progress' },
    COMPLETED: { name: 'COMPLETED', displayName: 'Completed' },
    BLOCKED: { name: 'BLOCKED', displayName: 'Blocked' },
    CANCELLED: { name: 'CANCELLED', displayName: 'Cancelled' }
});

// Get status by name
const getStatusByName = (name) => {
    const upperName = name.toUpperCase().replace(' ', '_').replace('-', '_');
    return Object.values(TaskStatus).find(s => s.name === upperName) || TaskStatus.PENDING;
};

// Check if status is terminal (completed or cancelled)
const isTerminal = (status) => {
    return status === TaskStatus.COMPLETED || status === TaskStatus.CANCELLED;
};

// Check if transition is valid (same logic as Java)
const canTransitionTo = (currentStatus, newStatus) => {
    if (currentStatus === newStatus) return true;

    switch (currentStatus) {
        case TaskStatus.PENDING:
            return newStatus === TaskStatus.IN_PROGRESS ||
                   newStatus === TaskStatus.BLOCKED ||
                   newStatus === TaskStatus.CANCELLED;
        case TaskStatus.IN_PROGRESS:
            return newStatus === TaskStatus.COMPLETED ||
                   newStatus === TaskStatus.BLOCKED ||
                   newStatus === TaskStatus.CANCELLED;
        case TaskStatus.BLOCKED:
            return newStatus === TaskStatus.PENDING ||
                   newStatus === TaskStatus.CANCELLED;
        case TaskStatus.COMPLETED:
        case TaskStatus.CANCELLED:
            return false;
        default:
            return false;
    }
};

const getAllStatuses = () => Object.values(TaskStatus);

export { TaskStatus, getStatusByName, isTerminal, canTransitionTo, getAllStatuses };