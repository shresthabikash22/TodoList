
//UserCOntroller
import express from 'express';
import UserService from '../services/UserService.js';

const router = express.Router();
const userService = new UserService();

// Add user
router.post('/users/add', async (req, res) => {
    try {
        const { username } = req.body;
        await userService.createUser(username);
        req.session = req.session || {};
        req.session.successMessage = `User '${username}' created successfully.`;
    } catch (error) {
        req.session = req.session || {};
        req.session.errorMessage = error.message;
    }
    res.redirect('/');
});

export default router;