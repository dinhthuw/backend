const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Vui lòng nhập tên sách"],
        trim: true,
        unique: true
    },
    description: {
        type: String,
        required: [true, "Vui lòng nhập mô tả sách"],
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, "Vui lòng chọn danh mục sách"]
    },
    oldPrice: {
        type: Number,
        required: [true, "Vui lòng nhập giá cũ"],
        min: [0, "Giá không được âm"]
    },
    newPrice: {
        type: Number,
        required: [true, "Vui lòng nhập giá mới"],
        min: [0, "Giá không được âm"],
        validate: {
            validator: function(v) {
                return v < this.oldPrice;
            },
            message: "Giá mới phải nhỏ hơn giá cũ"
        }
    },
    coverImage: {
        type: String,
        required: [true, "Vui lòng chọn ảnh bìa sách"],
        validate: {
            validator: function(v) {
                return v.startsWith('data:image/');
            },
            message: "Ảnh bìa sách không hợp lệ"
        }
    },
    trending: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Book', bookSchema);