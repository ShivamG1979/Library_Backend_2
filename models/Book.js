// models/Book.js
import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({ 
    title: { type: String, required: true },
    author: { type: String, required: true }, 
    year: { type: Number, required: true }, 
    image: { type: String, required: true },
    available: { type: Boolean, default: true }, 
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Admin who added the book
    issuedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // User who has borrowed the book
}, { timestamps: true });

bookSchema.index({ title: 1, author: 1 });

const Book = mongoose.model('Book', bookSchema);
export default Book;
