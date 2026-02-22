import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import userController from './controllers/UserController.js';
import taskController from './controllers/TaskController.js';
import { initializeData } from './init/DataInitializer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Session middleware
app.use(session({
    secret: 'your-secret-key-change-this-in-production',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,  // set to true if using HTTPS
        maxAge: 60000 // 1 minute
    }
}));

// Other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Make session messages available to views
app.use((req, res, next) => {
    res.locals.successMessage = req.session?.successMessage || null;
    res.locals.errorMessage = req.session?.errorMessage || null;
    delete req.session.successMessage;
    delete req.session.errorMessage;
    next();
});

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', userController);
app.use('/', taskController);

// Start server first, THEN initialize data
const server = app.listen(PORT, () => {
    // Initialize data after server is running
    setTimeout(() => {
        initializeData().catch(console.error);
    }, 100);
});

export { app, server };