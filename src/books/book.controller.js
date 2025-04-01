const Book = require("./book.model");
const Category = require('../categories/category.model');

// Get all books
const getAllBooks = async (req, res) => {
    try {
        const books = await Book.find().populate('category');
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get book by ID
const getBookById = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id).populate('category');
        if (!book) {
            return res.status(404).json({ message: 'Không tìm thấy sách' });
        }
        res.status(200).json(book);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create new book
const postABook = async (req, res) => {
    try {
        console.log('=== START ADDING NEW BOOK ===');
        console.log('Request body:', req.body);

        // Validate required fields
        const { title, description, category, oldPrice, newPrice, coverImage } = req.body;
        if (!title || !description || !category || !oldPrice || !newPrice) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng điền đầy đủ thông tin sách",
                required: ['title', 'description', 'category', 'oldPrice', 'newPrice']
            });
        }

        // Validate prices
        const oldPriceNum = Number(oldPrice);
        const newPriceNum = Number(newPrice);
        
        if (isNaN(oldPriceNum) || isNaN(newPriceNum) || oldPriceNum < 0 || newPriceNum < 0) {
            return res.status(400).json({
                success: false,
                message: "Giá sách không hợp lệ. Vui lòng kiểm tra lại."
            });
        }

        // Check if category exists
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(404).json({ 
                success: false,
                message: 'Không tìm thấy danh mục' 
            });
        }

        // Create book data object
        const bookData = {
            title: title.trim(),
            description: description.trim(),
            category: category,
            trending: Boolean(req.body.trending),
            oldPrice: oldPriceNum,
            newPrice: newPriceNum,
            coverImage: coverImage || "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        };

        // Create and save book
        const newBook = new Book(bookData);
        const savedBook = await newBook.save();

        // Populate category information
        const populatedBook = await Book.findById(savedBook._id).populate('category');

        console.log('Book saved successfully:', populatedBook);
        console.log('=== END ADDING NEW BOOK ===');

        res.status(201).json({
            success: true,
            message: "Thêm sách thành công",
            book: populatedBook
        });
    } catch (error) {
        console.error("=== ERROR CREATING BOOK ===");
        console.error("Error details:", error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: "Dữ liệu không hợp lệ",
                errors: Object.values(error.errors).map(err => err.message)
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false,
                message: "Sách đã tồn tại trong hệ thống"
            });
        }
        
        // Handle other errors
        res.status(500).json({
            success: false,
            message: "Không thể thêm sách mới",
            error: error.message
        });
    }
};

// Update book
const updateBook = async (req, res) => {
    try {
        console.log('=== START UPDATING BOOK ===');
        console.log('Book ID:', req.params.id);
        console.log('Update data:', req.body);

        const book = await Book.findById(req.params.id);
        if (!book) {
            console.log('Book not found:', req.params.id);
            return res.status(404).json({ message: 'Không tìm thấy sách' });
        }

        // Validate prices if provided
        if (req.body.oldPrice || req.body.newPrice) {
            const oldPriceNum = Number(req.body.oldPrice || book.oldPrice);
            const newPriceNum = Number(req.body.newPrice || book.newPrice);
            
            if (isNaN(oldPriceNum) || isNaN(newPriceNum) || oldPriceNum < 0 || newPriceNum < 0) {
                return res.status(400).json({
                    message: "Giá sách không hợp lệ. Vui lòng kiểm tra lại."
                });
            }
        }

        // Validate coverImage if provided
        if (req.body.coverImage && !req.body.coverImage.startsWith('data:image/')) {
            return res.status(400).json({
                message: "Ảnh bìa sách không hợp lệ. Vui lòng chọn ảnh khác."
            });
        }

        // Check category if provided
        if (req.body.category) {
            const categoryExists = await Category.findById(req.body.category);
            if (!categoryExists) {
                return res.status(404).json({ message: 'Không tìm thấy danh mục' });
            }
        }

        // Update fields
        Object.keys(req.body).forEach(key => {
            if (key === 'oldPrice' || key === 'newPrice') {
                book[key] = Number(req.body[key]);
            } else if (key === 'trending') {
                book[key] = Boolean(req.body[key]);
            } else if (key === 'title' || key === 'description') {
                book[key] = req.body[key].trim();
            } else {
                book[key] = req.body[key];
            }
        });

        const updatedBook = await book.save();
        console.log('Book updated successfully:', updatedBook);
        console.log('=== END UPDATING BOOK ===');

        res.status(200).json({
            success: true,
            message: "Cập nhật sách thành công",
            book: updatedBook
        });
    } catch (error) {
        console.error("=== ERROR UPDATING BOOK ===");
        console.error("Error details:", error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: "Dữ liệu không hợp lệ",
                errors: Object.values(error.errors).map(err => err.message)
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({ 
                message: "Sách đã tồn tại trong hệ thống"
            });
        }

        res.status(500).json({
            success: false,
            message: "Không thể cập nhật sách",
            error: error.message
        });
    }
};

// Delete book
const deleteABook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Không tìm thấy sách' });
        }
        await book.deleteOne();
        res.status(200).json({ message: 'Xóa sách thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllBooks,
    getBookById,
    postABook,
    updateBook,
    deleteABook
};