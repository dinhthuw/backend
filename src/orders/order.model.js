const mongoose =  require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
    },
    address: {
        city: {
            type: String,
            required: true,
        },
        country: String,
        state: String,
        zipcode: String,
    },
    phone: {
        type: Number,
        required: true,
    },
    productIds:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book',
            required: true,
        }
    ],
    totalPrice: {
        type: Number,
        required: true,
        min: 0,
        get: function(value) {
            return Math.round(value);
        }
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    }
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
})

const Order =  mongoose.model('Order', orderSchema);

module.exports = Order;