const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Public routes
router.post('/register', userController.createUser);

// Protected routes
router.get('/me', auth, userController.getUserById);

// Admin routes
router.get('/', [auth, admin], userController.getAllUsers);
router.get('/:id', [auth, admin], userController.getUserById);
router.put('/:id', [auth, admin], userController.updateUser);
router.delete('/:id', [auth, admin], userController.deleteUser);

module.exports = router; 