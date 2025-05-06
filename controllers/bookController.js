// controllers/bookController.js
import Book from '../models/Book.js';
import BookRequest from '../models/BookRequest.js';

// Get all books for browsing (public route)
export const getBooks = async (req, res) => {
    try {
        const books = await Book.find().select('-__v');
        res.json(books);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get book details (public route)
export const getBookById = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.json(book);
    } catch (error) {
        console.error('Error fetching book details:', error);
        res.status(500).json({ message: error.message });
    }
};

// User requests a book
export const requestBook = async (req, res) => {
    const { bookId } = req.body;
    const userId = req.user.id;

    try {
        // Check if book exists and is available
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        if (!book.available) {
            return res.status(400).json({ message: 'Book is already issued to someone else' });
        }

        // Check if user already has a pending request for this book
        const existingRequest = await BookRequest.findOne({
            book: bookId,
            user: userId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'You already have a pending request for this book' });
        }

        // Create new book request
        const bookRequest = new BookRequest({
            book: bookId,
            user: userId,
            status: 'pending',
            requestDate: new Date()
        });

        await bookRequest.save();
        res.status(201).json({ message: 'Book request submitted successfully', request: bookRequest });
    } catch (error) {
        console.error('Error requesting book:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get user's book requests
export const getUserRequests = async (req, res) => {
    try {
        const requests = await BookRequest.find({ user: req.user.id })
            .populate('book', 'title author image')
            .sort({ createdAt: -1 });
        
        res.json(requests);
    } catch (error) {
        console.error('Error fetching user requests:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get user's currently borrowed books
export const getUserBorrowedBooks = async (req, res) => {
    try {
        const approvedRequests = await BookRequest.find({ 
            user: req.user.id,
            status: 'approved',
            returnDate: null
        }).populate('book', 'title author year image');
        
        res.json(approvedRequests);
    } catch (error) {
        console.error('Error fetching borrowed books:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};