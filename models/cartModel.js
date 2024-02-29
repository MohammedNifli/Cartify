const mongoose= require('mongoose')
const cartSchema= new mongoose.Schema({
 
    user_id: {
        type: mongoose.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    
    items: [
        {
            product_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },
            quantity: {
                type: Number,
                default: 1,

            },
            price: {
                type: Number,
                required: true
            }
        }
    ],

    couponId:{
        type: mongoose.Types.ObjectId,
        ref: 'Coupon', 
        

    },
    couponApplied: {
        type: Boolean,
        default: false
    },
    Tprice:{
        type:Number,
        default:0
        
        
    },


    totalPrice: {
        type: Number,
        default: 0
    }
    
    
})


const Cart= mongoose.model('Cart',cartSchema);

module.exports=Cart;