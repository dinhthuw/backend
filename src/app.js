const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./auth/auth.routes');
const bookRoutes = require('./books/book.route');
const categoryRoutes = require('./categories/category.routes');
const orderRoutes = require('./orders/order.routes');
const userRoutes = require('./users/user.routes');
const { verifyAdminToken } = require('./middleware/verifyAdminToken');

dotenv.config();

const app = express();

app.use(cors({
    origin: '*',  // Allow all origins
    credentials: true,  // Allow cookies or authentication info to be sent with the request
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],  // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],  // Allowed headers
    exposedHeaders: ['Content-Range', 'X-Content-Range'],  // Headers exposed to the browser
    maxAge: 600  // Cache preflight request for 600 seconds (10 minutes)
}));



// Increase payload size limits to maximum
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Body size:', JSON.stringify(req.body).length, 'bytes');
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    if (err.name === 'PayloadTooLargeError') {
        return res.status(413).json({
            success: false,
            message: 'Request entity too large',
            error: 'The uploaded file is too large. Please try a smaller file.'
        });
    }
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: err.message
    });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        // Log available collections and their counts
        mongoose.connection.db.listCollections().toArray((err, collections) => {
            if (err) {
                console.error('Error listing collections:', err);
                return;
            }
            console.log('Available collections:', collections.map(c => c.name));
            
            // Get counts for each collection
            const counts = {};
            collections.forEach(collection => {
                mongoose.connection.db.collection(collection.name).countDocuments()
                    .then(count => {
                        counts[collection.name] = count;
                        if (Object.keys(counts).length === collections.length) {
                            console.log('Data counts:', counts);
                        }
                    })
                    .catch(err => console.error(`Error counting ${collection.name}:`, err));
            });
        });
        const PORT = process.env.PORT || 5001;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
    }); 
