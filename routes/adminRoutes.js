// routes/adminRoutes.js
import express from 'express';
import { 
    getAllUsers, 
    getAllBooks, 
    addBook,
    updateBook,
    deleteBook, 
    getAllBookRequests,
    getPendingRequests,
    approveBookRequest,
    rejectBookRequest,
    processBookReturn,
    getLibraryStatistics,
    deleteUser, 
    updateUser,
    addUser
} from '../controllers/adminController.js';
import { auth, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require both authentication and admin role
router.use(auth, isAdmin);

// User management routes
router.get('/users', getAllUsers);
router.post('/users', addUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Book management routes
router.get('/books', getAllBooks);
router.post('/books', addBook);
router.put('/books/:id', updateBook);
router.delete('/books/:id', deleteBook);

// Book request management routes
router.get('/requests', getAllBookRequests);
router.get('/requests/pending', getPendingRequests);
router.put('/requests/approve/:requestId', approveBookRequest);
router.put('/requests/reject/:requestId', rejectBookRequest);
router.put('/requests/return/:requestId', processBookReturn);

// Dashboard statistics
router.get('/statistics', getLibraryStatistics);

export default router;