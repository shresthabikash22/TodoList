// Equivalent to Java Enum
const Category = Object.freeze({
    WORK: { name: 'WORK', displayName: 'Work' },
    PERSONAL: { name: 'PERSONAL', displayName: 'Personal' },
    URGENT: { name: 'URGENT', displayName: 'Urgent' },
    OTHER: { name: 'OTHER', displayName: 'Other' }
});

// Helper functions
const getCategoryByName = (name) => {
    const upperName = name.toUpperCase();
    return Object.values(Category).find(c => c.name === upperName) || Category.OTHER;
};

const getAllCategories = () => Object.values(Category);

const getCategoryDisplayName = (category) => category.displayName;

export { Category, getCategoryByName, getAllCategories, getCategoryDisplayName };