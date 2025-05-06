// routes/bookRoutes.js
import express from 'express';
import { 
    getBooks, 
    getBookById,
    requestBook, 
    getUserRequests,
    getUserBorrowedBooks
} from '../controllers/bookController.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getBooks);
router.get('/:id', getBookById);

// Protected routes (user)
router.post('/request', auth, requestBook);
router.get('/user/requests', auth, getUserRequests);
router.get('/user/borrowed', auth, getUserBorrowedBooks);

export default router;
