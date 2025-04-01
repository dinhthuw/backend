const mongoose = require('mongoose');
const User = require('../users/user.model');
const dotenv = require('dotenv');

dotenv.config();

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if admin exists
        const adminExists = await User.findOne({ username: 'admin' });
        if (adminExists) {
            console.log('Admin account already exists');
            process.exit(0);
        }

        // Create admin account
        const admin = new User({
            username: 'admin',
            password: '123456',
            email: 'admin@example.com',
            name: 'Admin',
            role: 'admin',
            isActive: true
        });

        await admin.save();
        console.log('Admin account created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin account:', error);
        process.exit(1);
    }
};

createAdmin(); 