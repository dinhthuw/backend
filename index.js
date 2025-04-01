const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const port = process.env.PORT || 5001;

dotenv.config();

const app = express();

// Cấu hình multer cho upload file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// middleware
app.use(express.json());
app.use(cors({
    origin: ['https://frontend-4dmp.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true
}));

// Phục vụ file tĩnh từ thư mục uploads
app.use('/uploads', express.static('uploads'));

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
});

// routes
const bookRoutes = require('./src/books/book.route');
const orderRoutes = require("./src/orders/order.route");
const userRoutes = require("./src/users/user.route");
const categoryRoutes = require("./src/categories/category.routes");
const authRoutes = require("./src/auth/auth.routes");

// Register routes
app.use("/api/books", bookRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);

// MongoDB Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Test connection by listing collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
        
        // Test data retrieval
        const userCount = await mongoose.connection.db.collection('users').countDocuments();
        const bookCount = await mongoose.connection.db.collection('books').countDocuments();
        const categoryCount = await mongoose.connection.db.collection('categories').countDocuments();
        
        console.log('Data counts:', {
            users: userCount,
            books: bookCount,
            categories: categoryCount
        });
        
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Handle MongoDB connection errors
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Đã xảy ra lỗi, vui lòng thử lại sau' });
});

// Start server
const startServer = async () => {
    try {
        // Connect to MongoDB first
        await connectDB();
        
        // Then start the server
        app.listen(port, () => {
            console.log(`Server đang chạy trên port ${port}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
};

startServer();
