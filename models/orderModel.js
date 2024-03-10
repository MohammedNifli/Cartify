const mongoose = require('mongoose');

// Define the order schema
const orderSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    billingAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address', 
    },
    totalAmount: {
        type: Number,
        required: true
    },
    items: [
        {
            product_id: {
                type: mongoose.Types.ObjectId,
                ref: "Product",
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            status: {
                type: String,
                enum: ['pending', 'shipped', 'delivered', 'cancelled'],
                default: 'pending',
                required: true
            },
            reason:{
                type:String,
                
            }
        }
    ],
    payment: {
        type: String,
        required: true
    },
    // Timestamps for order creation and last update
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: null,
    },
});

// Create the Order model
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
