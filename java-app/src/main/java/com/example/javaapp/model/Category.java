package com.example.javaapp.model;

public enum Category {
    WORK("Work"),
    PERSONAL("Personal"),
    URGENT("Urgent"),
    OTHER("Other");

    private final String displayName;

    Category(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
