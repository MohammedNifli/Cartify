const mongoose=require('mongoose');

const categorySchema = new mongoose.Schema({
    categoryName: { type: String, required: true},
    categoryImage: { type: String, required: true },
    isDeleted: { type: Boolean, default: false }
});
categorySchema.index({ categoryName: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });


const Category = mongoose.model('Category', categorySchema);

module.exports = Category; 