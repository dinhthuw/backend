const express = require('express');
const User = require('./user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || '123456';

// Test route to check database connection and data
router.get("/test", async (req, res) => {
    try {
        // Check if we can connect to the database
        const dbState = mongoose.connection.readyState;
        const dbStatus = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };

        // Get all users
        const users = await User.find().select("-password");
        
        // Get counts from all collections
        const userCount = await mongoose.connection.db.collection('users').countDocuments();
        const bookCount = await mongoose.connection.db.collection('books').countDocuments();
        const categoryCount = await mongoose.connection.db.collection('categories').countDocuments();
        const orderCount = await mongoose.connection.db.collection('orders').countDocuments();
        
        res.json({
            message: "Database connection test",
            status: dbStatus[dbState],
            collections: {
                users: userCount,
                books: bookCount,
                categories: categoryCount,
                orders: orderCount
            },
            users: users
        });
    } catch (error) {
        console.error("Database test error:", error);
        res.status(500).json({ 
            message: "Database connection error",
            error: error.message 
        });
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

// Đăng ký người dùng
router.post("/register",
    [
        body('username').notEmpty().withMessage('Username không được để trống'),
        body('password').isLength({ min: 6 }).withMessage('Password phải có ít nhất 6 ký tự'),
        body('email').isEmail().withMessage('Email không hợp lệ'),
        body('name').notEmpty().withMessage('Tên không được để trống'),
        body('address').optional(),
        body('phone').optional()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password, email, name, address, phone } = req.body;

        try {
            // Kiểm tra xem username đã tồn tại chưa
            const existingUser = await User.findOne({ $or: [{ username }, { email }] });
            if (existingUser) {
                return res.status(400).json({ message: "Username hoặc email đã tồn tại" });
            }

            // Tạo một user mới
            const newUser = new User({
                username,
                password,
                email,
                name,
                address,
                phone,
                role: 'user',
                isActive: true
            });

            // Lưu user vào DB
            await newUser.save();

            // Tạo token JWT
            const token = jwt.sign(
                { id: newUser._id, username: newUser.username, role: newUser.role },
                JWT_SECRET,
                { expiresIn: "1h" }
            );

            res.status(201).json({
                message: "Đăng ký thành công",
                token: token,
                user: {
                    username: newUser.username,
                    email: newUser.email,
                    name: newUser.name,
                    role: newUser.role
                }
            });
        } catch (error) {
            console.error("Lỗi khi đăng ký", error);
            res.status(500).json({ message: "Đăng ký thất bại" });
        }
    });

// Route lấy thông tin người dùng đã đăng nhập
router.get("/me", async (req, res) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
  
    if (!token) {
      return res.status(401).send({ message: "Access Denied, token required" });
    }
  
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
  
      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }
  
      return res.status(200).json({
        message: "User information fetched successfully",
        user: {
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          address: user.address,
          phone: user.phone
        }
      });
    } catch (error) {
      console.error("Error fetching user info", error);
      return res.status(500).send({ message: "Server error" });
    }
});

// Route lấy danh sách người dùng (chỉ admin)
router.get("/users", async (req, res) => {
    try {
      const users = await User.find().select("-password");
      if (!users) {
        return res.status(404).json({ message: 'No users found' });
      }
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
