const mongoose = require('mongoose');

// Define Product Offer Schema
const productOfferSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Reference to the Product model
    discountPercentage: Number,
    validFrom: Date,
    validUntil: Date,
    // Other properties as needed
});

const ProductOffer = mongoose.model('ProductOffer', productOfferSchema);

module.exports = ProductOffer;
