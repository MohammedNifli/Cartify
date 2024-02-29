const mongoose = require('mongoose');

// Define Category Offer Schema
const categoryOfferSchema = new mongoose.Schema({
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    discountPercentage: Number,
    validFrom: Date,
    validUntil: Date,
    // Other properties as needed
});

const CategoryOffer = mongoose.model('CategoryOffer', categoryOfferSchema);

module.exports = CategoryOffer;
