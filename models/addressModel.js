const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    Addresses: [
        {
            name: { type: String, required: true },
            villaName: { type: String, required: true },
            cityName: { type: String, required: true },
            zipcode: { type: Number, required: true },
        },
    ],
});

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;



 // name: { type: String, required: true },
    // villaName: { type: String, required: true },
    // cityName: { type: String, required: true },
    // zipcode: { type:  Number, required: true },