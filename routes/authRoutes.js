// routes/authRoutes.js
import express from 'express';
import { 
    register, 
    login, 
    getProfile, 
    updateProfile 
} from '../controllers/authController.js';
import { registerAdmin } from '../controllers/adminController.js';
import { auth, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

// Admin routes
router.post('/admin/register', auth, isAdmin, registerAdmin); // Only existing admins can register new admins

export default router;
