// models/BookRequest.js
import mongoose from 'mongoose';

const bookRequestSchema = new mongoose.Schema({
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected', 'returned'], 
        default: 'pending' 
    },
    requestDate: { type: Date, default: Date.now },
    approvalDate: { type: Date },
    dueDate: { type: Date },
    returnDate: { type: Date }
}, { timestamps: true });

const BookRequest = mongoose.model('BookRequest', bookRequestSchema);
export default BookRequest;