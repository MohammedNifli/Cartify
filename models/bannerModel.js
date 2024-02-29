const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    bannerImage: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true }
});

module.exports = mongoose.model('Banner', bannerSchema);
