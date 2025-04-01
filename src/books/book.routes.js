const express = require('express');
const router = express.Router();
const { verifyAdminToken } = require('../middleware/verifyAdminToken');
const {
    getAllBooks,
    getBookById,
    postABook,
    updateBook,
    deleteABook
} = require('./book.controller');

// Logging middleware
const logRequest = (req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
};

// Apply logging middleware to all routes
router.use(logRequest);

// Public routes
router.get('/', getAllBooks);
router.get('/:id', getBookById);

// Protected routes (require admin token)
router.post('/', verifyAdminToken, postABook);
router.put('/:id', verifyAdminToken, updateBook);
router.delete('/:id', verifyAdminToken, deleteABook);

module.exports = router; 