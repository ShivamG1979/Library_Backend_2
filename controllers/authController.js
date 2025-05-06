// controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Register regular user
export const register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            username,
            email,
            password: hashedPassword,
            role: 'user'  // Default role
        });

        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Login (works for both users and admins)
export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User does not exist' }); 
        }

        const isMatch = await bcrypt.compare(password, user.password);  
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ 
            id: user._id,
            role: user.role 
        }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        res.json({ 
            token, 
            role: user.role,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get user profile
export const getProfile = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(400).json({ message: 'User ID not found' });
        }

        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update user profile
export const updateProfile = async (req, res) => {
    const { username, email, currentPassword, newPassword } = req.body; 
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (username) user.username = username;
        if (email) user.email = email;

        // If user wants to change password
        if (currentPassword && newPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }
            
            const hashedNewPassword = await bcrypt.hash(newPassword, 12);
            user.password = hashedNewPassword;
        }

        await user.save();
        res.json({ message: 'Profile updated successfully', user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }});
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};