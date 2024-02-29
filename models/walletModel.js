const mongoose = require('mongoose');

// Define the schema for the wallet
const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    },
    transactions: [{
        type: {
            type: String,
            enum: ['credit', 'debit','refund'],
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        bigBalance:{
            type:Number,
            require:true
            
           

        },
        timestamp: {
            type: Date,
            required: true,
            default: Date.now
        }
    }]
});

// Create the Wallet model
const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
