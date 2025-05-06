// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware for authenticating JWT
export const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
   
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Middleware for checking if the user is an admin
export const isAdmin = async (req, res, next) => { 
    try {
        if (req.user.role === 'admin') {
            return next();
        }
        
        // Double-check in the database if needed
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        next();
    } catch (error) {
        console.error('isAdmin Middleware Error:', error);
        res.status(500).json({ message: 'Server error', error });
    } 
};