import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import userController from './controllers/userController.js';
import taskController from './controllers/taskController.js';
import { initializeData } from './init/dataInitializer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', userController);
app.use('/', taskController);

// Initialize data on startup
await initializeData();

// Start server
app.listen(PORT, () => {
    console.log('\n========================================');
    console.log('Collaborative To-Do List — JavaScript');
    console.log('Express + EJS + File Storage');
    console.log('========================================');
    console.log(`🚀 Server running at: http://localhost:${PORT}`);
    console.log('========================================\n');
});