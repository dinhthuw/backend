const express = require('express');
const router = express.Router();
const { verifyAdminToken } = require('../middleware/verifyAdminToken');
const { logRequest } = require('../middleware/logRequest');
const {
    getAllBooks,
    getBookById,
    postABook,
    updateBook,
    deleteABook
} = require('./book.controller');

// Log all requests to book routes
router.use(logRequest);

// Public routes
router.get('/', getAllBooks);
router.get('/:id', getBookById);

// Protected routes (admin only)
router.post('/', verifyAdminToken, (req, res, next) => {
    // Kiểm tra role từ token
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Bạn không có quyền thực hiện thao tác này'
        });
    }
}, postABook);

router.put('/:id', verifyAdminToken, (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Bạn không có quyền thực hiện thao tác này'
        });
    }
}, updateBook);

router.delete('/:id', verifyAdminToken, (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Bạn không có quyền thực hiện thao tác này'
        });
    }
}, deleteABook);

module.exports = router;
