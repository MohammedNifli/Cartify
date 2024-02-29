const mongoose =require("mongoose");
const Product=require('./productModel')


const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    country: { type: String, required: true },
    password: { type: String, required: true },
    isOnline: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    refferalId:{type:String,required:true},
    is_admin: { type: Boolean, default: false },
    
});

module.exports=mongoose.model('User',userSchema)