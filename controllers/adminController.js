// controllers/adminController.js
import User from '../models/User.js';
import Book from '../models/Book.js';
import BookRequest from '../models/BookRequest.js';
import bcrypt from 'bcryptjs';

// Register admin (requires admin privileges)
export const registerAdmin = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new admin user
        const newAdmin = new User({
            username,
            email,
            password: hashedPassword,
            role: 'admin'
        });

        // Save admin to the database
        await newAdmin.save();

        res.status(201).json({ message: 'Admin registered successfully' });
    } catch (error) {
        console.error('Error registering admin:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get All Users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get All Books
export const getAllBooks = async (req, res) => {
    try {
        const books = await Book.find().populate('addedBy', 'username email').populate('issuedTo', 'username email');
        res.json(books);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Add Book (admin only)
export const addBook = async (req, res) => {
    const { title, author, year, image } = req.body;
    const adminId = req.user.id;

    if (!title || !author || !year || !image) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const newBook = new Book({
            title,
            author,
            year,
            image,
            available: true,
            addedBy: adminId
        });

        await newBook.save();

        res.status(201).json({ message: 'Book added successfully', book: newBook });
    } catch (error) {
        console.error('Error adding book:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update Book
export const updateBook = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedBook = await Book.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedBook) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.json(updatedBook);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete Book
export const deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        
        // Check if book is currently issued
        if (!book.available && book.issuedTo) {
            return res.status(400).json({ message: 'Cannot delete a book that is currently issued' });
        }
        
        // Delete any pending requests for this book
        await BookRequest.deleteMany({ book: req.params.id, status: 'pending' });
        
        // Delete the book
        await Book.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all book requests
export const getAllBookRequests = async (req, res) => {
    try {
        const requests = await BookRequest.find()
            .populate('book', 'title author image')
            .populate('user', 'username email')
            .sort({ createdAt: -1 });
        
        res.json(requests);
    } catch (error) {
        console.error('Error fetching book requests:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get pending book requests
export const getPendingRequests = async (req, res) => {
    try {
        const pendingRequests = await BookRequest.find({ status: 'pending' })
            .populate('book', 'title author image')
            .populate('user', 'username email')
            .sort({ requestDate: 1 });
        
        res.json(pendingRequests);
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Approve book request
export const approveBookRequest = async (req, res) => {
    const { requestId } = req.params;
    const { dueDate } = req.body;
    
    try {
        const bookRequest = await BookRequest.findById(requestId);
        if (!bookRequest) {
            return res.status(404).json({ message: 'Book request not found' });
        }
        
        if (bookRequest.status !== 'pending') {
            return res.status(400).json({ message: 'This request has already been processed' });
        }
        
        // Check if book is still available
        const book = await Book.findById(bookRequest.book);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        
        if (!book.available) {
            return res.status(400).json({ message: 'Book is no longer available' });
        }
        
        // Update book status
        book.available = false;
        book.issuedTo = bookRequest.user;
        await book.save();
        
        // Update request status
        bookRequest.status = 'approved';
        bookRequest.approvalDate = new Date();
        bookRequest.dueDate = dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // Default 14 days if not specified
        await bookRequest.save();
        
        // Reject any other pending requests for this book
        await BookRequest.updateMany(
            { book: bookRequest.book, status: 'pending', _id: { $ne: requestId } },
            { status: 'rejected' }
        );
        
        res.status(200).json({ message: 'Book request approved successfully', request: bookRequest });
    } catch (error) {
        console.error('Error approving book request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Reject book request
export const rejectBookRequest = async (req, res) => {
    const { requestId } = req.params;
    
    try {
        const bookRequest = await BookRequest.findById(requestId);
        if (!bookRequest) {
            return res.status(404).json({ message: 'Book request not found' });
        }
        
        if (bookRequest.status !== 'pending') {
            return res.status(400).json({ message: 'This request has already been processed' });
        }
        
        // Update request status
        bookRequest.status = 'rejected';
        await bookRequest.save();
        
        res.status(200).json({ message: 'Book request rejected successfully', request: bookRequest });
    } catch (error) {
        console.error('Error rejecting book request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Process book return
export const processBookReturn = async (req, res) => {
    const { requestId } = req.params;
    
    try {
        const bookRequest = await BookRequest.findById(requestId);
        if (!bookRequest) {
            return res.status(404).json({ message: 'Book request not found' });
        }
        
        if (bookRequest.status !== 'approved') {
            return res.status(400).json({ message: 'This book was not issued or has already been returned' });
        }
        
        // Update book status
        const book = await Book.findById(bookRequest.book);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        
        book.available = true;
        book.issuedTo = null;
        await book.save();
        
        // Update request status
        bookRequest.status = 'returned';
        bookRequest.returnDate = new Date();
        await bookRequest.save();
        
        res.status(200).json({ message: 'Book return processed successfully', request: bookRequest });
    } catch (error) {
        console.error('Error processing book return:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get statistics for admin dashboard
export const getLibraryStatistics = async (req, res) => {
    try {
        const totalBooks = await Book.countDocuments();
        const availableBooks = await Book.countDocuments({ available: true });
        const borrowedBooks = await Book.countDocuments({ available: false });
        const totalUsers = await User.countDocuments({ role: 'user' });
        const pendingRequests = await BookRequest.countDocuments({ status: 'pending' });
        
        // Recent activities (last 20)
        const recentActivity = await BookRequest.find()
            .populate('book', 'title')
            .populate('user', 'username')
            .sort({ createdAt: -1 })
            .limit(20)
            .select('book user status createdAt');
        
        // Books due soon (in next 7 days)
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const booksDueSoon = await BookRequest.find({
            status: 'approved',
            dueDate: { $gte: today, $lte: nextWeek }
        })
            .populate('book', 'title')
            .populate('user', 'username email')
            .sort({ dueDate: 1 });
        
        // Overdue books
        const overdueBooks = await BookRequest.find({
            status: 'approved',
            dueDate: { $lt: today }
        })
            .populate('book', 'title')
            .populate('user', 'username email')
            .sort({ dueDate: 1 });
        
        res.json({
            totalBooks,
            availableBooks,
            borrowedBooks,
            totalUsers,
            pendingRequests,
            recentActivity,
            booksDueSoon,
            overdueBooks
        });
    } catch (error) {
        console.error('Error fetching library statistics:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Add User
export const addUser = async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user with specified role (or default to 'user')
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            role: role || 'user'
        });

        // Save user to the database
        await newUser.save();

        res.status(201).json({ 
            message: 'User added successfully', 
            user: {
                _id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Update User
export const updateUser = async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (username) user.username = username;
        if (email) user.email = email;
        if (role && ['user', 'admin'].includes(role)) user.role = role;
        
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 12);
            user.password = hashedPassword;
        }

        await user.save();
        res.json({ 
            message: 'User updated successfully', 
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Delete User
export const deleteUser = async (req, res) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }
        
        // Check if user has any borrowed books
        const hasBooks = await BookRequest.findOne({ 
            user: req.params.id,
            status: 'approved',
            returnDate: null
        });
        
        if (hasBooks) {
            return res.status(400).json({ message: 'User has borrowed books. Books must be returned before deletion.' });
        }
        
        // Delete user's pending requests
        await BookRequest.deleteMany({ user: req.params.id, status: 'pending' });
        
        // Delete user
        const result = await User.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};