const mongoose = require('mongoose');

const refferalSchema = new mongoose.Schema({

    refferalBonus:{
        type:String,
        required:true
    },
    signupBonus:{
        type:String,
        required:true

    }
    
    
});


const Referral = mongoose.model('Refferal', refferalSchema);
module.exports = Referral;