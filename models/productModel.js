const mongoose = require('mongoose');

const prodOfferSchema = new mongoose.Schema({
    prodOfferPrice: Number,
    prodDiscount: Number
})
const catOfferSchema = new mongoose.Schema({
    catOfferPrice: Number,
    catDiscount: Number
})

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true,unique:true },
    description: { type: String, required: true,unique:true },
    price: { type: Number, required: true },
    CatOffer: catOfferSchema,
    PrOffer: prodOfferSchema,

    // color: { type: String, required: true },
    countStock: { type: Number, required: true },
    category_id: { type:mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    productImages: {type:Array,required:true},
    isDeleted: { type: Boolean, default: false }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
