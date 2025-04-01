const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { verifyToken } = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../users/user.model');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const Book = require('../books/book.model');
const Order = require('../orders/order.model');

const JWT_SECRET = process.env.JWT_SECRET || '123456';

// Public routes
router.post('/login', authController.login);

// Protected routes
router.get('/me', verifyToken, authController.getCurrentUser);

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Update username if provided
        if (username) {
            const existingUser = await User.findOne({ username });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: 'Tên người dùng đã được sử dụng' });
            }
            user.username = username;
        }

        // Update password if provided
        if (password) {
            user.password = password;
        }

        await user.save();
        res.json({ 
            message: 'Cập nhật thông tin thành công',
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật thông tin' });
    }
});

// Admin routes
router.get('/admin', [verifyToken, admin], (req, res) => {
    res.json({ message: 'Admin access granted' });
});

// Register new user (admin only)
router.post('/register', [
    verifyToken, 
    admin,
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').isLength({ min: 6 }).withMessage('Password phải có ít nhất 6 ký tự'),
    body('name').notEmpty().withMessage('Tên không được để trống'),
    body('role').optional(),
    body('address').optional(),
    body('phone').optional()
], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password, name, role, address, phone, username } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email đã được sử dụng' });
        }

        // Format address as string if it's an object
        let addressStr = address;
        if (typeof address === 'object') {
            addressStr = JSON.stringify(address);
        }

        // Ensure username is provided explicitly as a direct property
        const userObj = {
            email,
            password,
            name,
            username: username || email, // Use email as username if not provided
            role: role || 'user',
            address: addressStr,
            phone,
            isActive: true
        };

        const user = new User(userObj);
        await user.save();
        res.status(201).json({ 
            message: 'Tạo người dùng thành công',
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                address: user.address,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Create user error:', error.message, error.stack);
        // Return more detailed error information
        return res.status(500).json({ 
            message: 'Lỗi khi tạo người dùng', 
            error: error.message,
            details: error.errors ? Object.keys(error.errors).map(key => ({
                field: key,
                message: error.errors[key].message
            })) : null
        });
    }
});

// Get all users (admin only)
router.get('/users', [verifyToken, admin], async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách người dùng' });
    }
});

// Get single user for editing (admin only)
router.get('/users/:id', [verifyToken, admin], async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Lỗi khi lấy thông tin người dùng' });
    }
});

// Update user (admin only)
router.put('/users/:id', [verifyToken, admin], async (req, res) => {
    try {
        const { username, email, password, role, isActive } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Update fields
        if (username) {
            const existingUser = await User.findOne({ username });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: 'Tên người dùng đã được sử dụng' });
            }
            user.username = username;
        }

        if (email) {
            const existingUser = await User.findOne({ email });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: 'Email đã được sử dụng' });
            }
            user.email = email;
        }

        if (password) {
            user.password = password;
        }

        if (role) {
            user.role = role;
        }

        if (isActive !== undefined) {
            user.isActive = isActive;
        }

        await user.save();
        res.json({ 
            message: 'Cập nhật thông tin người dùng thành công',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật thông tin người dùng' });
    }
});

// Đăng nhập Admin
router.post("/admin/login",
    [
        body('username').notEmpty().withMessage('Username không được để trống'),
        body('password').notEmpty().withMessage('Password không được để trống')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;
        try {
            const admin = await User.findOne({ username });
            if (!admin) {
                return res.status(404).send({ message: "Admin không tồn tại!" });
            }

            // So sánh mật khẩu
            const isPasswordValid = await admin.comparePassword(password);
            if (!isPasswordValid) {
                return res.status(401).send({ message: "Sai mật khẩu!" });
            }

            // Tạo JWT token
            const token = jwt.sign(
                { id: admin._id, username: admin.username, role: admin.role },
                JWT_SECRET,
                { expiresIn: "1h" }
            );

            // Gửi phản hồi thành công
            return res.status(200).json({
                message: "Đăng nhập thành công",
                token: token,
                user: {
                    username: admin.username,
                    email: admin.email,
                    name: admin.name,
                    role: admin.role
                }
            });

        } catch (error) {
            console.error("Lỗi khi đăng nhập admin", error);
            return res.status(500).send({ message: "Đăng nhập thất bại" });
        }
    });

// Kiểm tra quyền admin
router.get("/admin/check", [verifyToken, admin], (req, res) => {
    res.json({ 
        message: "Admin access granted",
        user: req.user
    });
});

// Admin dashboard statistics
router.get('/admin', verifyToken, admin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalBooks = await Book.countDocuments();
        const totalOrders = await Order.countDocuments();
        
        // Calculate total revenue
        const orders = await Order.find();
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

        res.json({
            totalUsers,
            totalBooks,
            totalOrders,
            totalRevenue
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new user (admin only)
router.post('/users', [
    verifyToken, 
    admin,
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').isLength({ min: 6 }).withMessage('Password phải có ít nhất 6 ký tự'),
    body('name').notEmpty().withMessage('Tên không được để trống'),
    body('role').optional(),
    body('address').optional(),
    body('phone').optional()
], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const { email, password, name, role, address, phone, username } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email đã được sử dụng' });
        }

        // Format address as string if it's an object
        let addressStr = address;
        if (typeof address === 'object') {
            addressStr = JSON.stringify(address);
        }

        // Ensure username is provided explicitly as a direct property
        const userObj = {
            email,
            password,
            name,
            username: username || email, // Use email as username if not provided
            role: role || 'user',
            address: addressStr,
            phone,
            isActive: true
        };

        const user = new User(userObj);
        await user.save();
        res.status(201).json({ 
            message: 'Tạo người dùng thành công',
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                address: user.address,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Create user error:', error.message, error.stack);
        // Return more detailed error information
        return res.status(500).json({ 
            message: 'Lỗi khi tạo người dùng', 
            error: error.message,
            details: error.errors ? Object.keys(error.errors).map(key => ({
                field: key,
                message: error.errors[key].message
            })) : null
        });
    }
});

router.delete('/users/:id', [verifyToken, admin], async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Soft delete by setting isActive to false
        user.isActive = false;
        await user.save();

        res.json({ message: 'Xóa người dùng thành công' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Lỗi khi xóa người dùng' });
    }
});

module.exports = router; 