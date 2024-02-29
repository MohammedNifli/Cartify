// Import mongoose
const mongoose = require('mongoose');

// Define the schema for OTP collection
const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 60000) } // Set expiry to 1 minute (60000 milliseconds)
});



// Create a Mongoose model for OTP collection
const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
