package com.example.javaapp.model;

public enum TaskStatus {
    PENDING("Pending"),
    IN_PROGRESS("In Progress"),
    COMPLETED("Completed"),
    BLOCKED("Blocked"),
    CANCELLED("Cancelled");

    private final String displayName;

    TaskStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public boolean isTerminal() {
        return this == COMPLETED || this == CANCELLED;
    }

    public boolean canTransitionTo(TaskStatus newStatus) {
        if (this == newStatus) return true;

        switch (this) {
            case PENDING:
                return newStatus == IN_PROGRESS || newStatus == BLOCKED || newStatus == CANCELLED;
            case IN_PROGRESS:
                return newStatus == COMPLETED || newStatus == BLOCKED || newStatus == CANCELLED;
            case BLOCKED:
                return newStatus == PENDING || newStatus == CANCELLED;
            case COMPLETED:
            case CANCELLED:
                return false;  // Terminal states
            default:
                return false;
        }
    }
}