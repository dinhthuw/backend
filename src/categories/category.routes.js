const express = require('express');
const router = express.Router();
const Category = require('./category.model');
const { verifyToken } = require('../middleware/auth');
const admin = require('../middleware/admin');

// Get all categories (public)
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single category (public)
router.get('/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create category (admin only)
router.post('/', [verifyToken, admin], async (req, res) => {
    try {
        const category = new Category({
            name: req.body.name,
            description: req.body.description
        });

        const newCategory = await category.save();
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update category (admin only)
router.patch('/:id', [verifyToken, admin], async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        if (req.body.name) category.name = req.body.name;
        if (req.body.description) category.description = req.body.description;
        if (req.body.isActive !== undefined) category.isActive = req.body.isActive;

        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete category (admin only) - Soft delete
router.delete('/:id', [verifyToken, admin], async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        category.isActive = false;
        await category.save();
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 