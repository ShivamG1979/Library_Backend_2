// config/db.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected to Library database');
        
        // Check if admin with this email exists
        const adminEmail = 'shiva@gmail.com';
        const adminExists = await User.findOne({ email: adminEmail });
        
        // If this specific admin doesn't exist, create one
        if (!adminExists) {
            console.log('Creating specified admin user...');
            
            // Admin credentials as specified
            const adminUsername = 'shiva';
            const password = '9907714067';
             
            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            // Create new admin
            const newAdmin = new User({
                username: adminUsername,
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
            });
            
            // Save to database
            await newAdmin.save();
            console.log('Admin user created successfully');
        } 
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
}; 

export default connectDB;