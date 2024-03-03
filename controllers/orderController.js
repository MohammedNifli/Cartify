const Admin= require('../models/adminModel');
const User= require('../models/userModel');
const Category=require('../models/categoryModel');
const Cart=require('../models/cartModel');
const Order=require('../models/orderModel');

const Coupon=require('../models/couponModel');
const AppliedCoupon = require('../models/appliedCoupon');
const Address= require('../models/addressModel')

 
const shortid = require('shortid');

const { Types: { ObjectId } } = require('mongoose');



const mongoose = require('mongoose');
const Product = require('../models/productModel');

const Wallet=require('../models/walletModel')

//razorpay payment
const Razorpay=require("razorpay");
const path=require('path');
const ejs=require('ejs');
const puppeteer=require('puppeteer')



// const totalPrice = cartDetails.reduce((total, item) => {
//   return total + (item.items.quantity * item.productDetails.price);
// }, 0);

//checkout loading

const loadCheckout = async (req, res) => {
  try {
    const userId = req.session.user_id;

    // Fetch the user's address
    const userAddress = await Address.findOne({ user_id: userId });
    
    // Fetch the user's cart details with product information
    const cartDetails = await Cart.aggregate([
      {
        $match: { user_id: new mongoose.Types.ObjectId(userId) }
      },
      {
        $unwind: "$items"
      },
      {
        $lookup: {
          from: "products",
          localField: "items.product_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $unwind: "$productDetails"
      },
      {
        $match: {'productDetails.isDeleted': false}
      }
    ]);

    // Calculate the total price of items in the cart
    // const totalPrice = cartDetails.reduce((total, item) => {
    //   return total + (item.items.quantity * item.productDetails.price);
    // }, 0);
    let totalAmount = 0;
    for (const item of cartDetails) {
      // Fetch latest price from the database for each item
      const productId = item.items.product_id;
      const product = await Product.findById(productId);
      const latestPrice = product.price; // Assuming price is stored directly in the product document

      // Update the price of the item in the cart
      item.items.price = latestPrice;

      // Calculate total price for the item
      const itemTotal = item.items.quantity * latestPrice;
      totalAmount += itemTotal;
    }

    // Update the total price of the cart
    const userCart = await Cart.findOneAndUpdate(
      { user_id: userId },
      { totalPrice: totalAmount },
      { new: true }
    );

    const coupons = await Coupon.find();
    
    // Pass the address data and other necessary information to the checkout EJS template
    res.render('checkOut', {
      addresses: userAddress ? userAddress.Addresses : [], // Pass the addresses array or an empty array if it doesn't exist
      cartDetails,
      user: req.session.user_id,
      totalPrice:totalAmount,
      couponApplied: req.session.couponApplied,
      selectedPaymentMethod: req.session.payment,
      errormessage,
      coupons
    });
    
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
};






let errormessage;



const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const paymentMethod = req.body.payment;
    const selectedAddressId = req.body.saddress;
    console.log("select:",selectedAddressId)
    req.session.payment = req.body.payment;

    console.log('User ID:', userId);
    console.log('Selected Address ID:', selectedAddressId);

    const selectedAddress = await Address.findOne(
      { user_id: new mongoose.Types.ObjectId(userId) },
      { addresses: { $elemMatch: { _id: selectedAddressId } } }
    );

    if (!selectedAddress) {
      throw new Error('Selected address not found');
    }

    const cartDetails = await Cart.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" }
      

    ]);

    if (!cartDetails || cartDetails.length === 0) {
      console.error("Cart details are empty.");
      return res.status(400).json({ error: "Cart details are empty." });
    }

    let totalPrice = 0;
    if (cartDetails[0].couponId) {
      const coupon = await Coupon.findOne({ _id: new mongoose.Types.ObjectId(cartDetails[0].couponId) });
      // if (coupon) {
      //   totalPrice -= coupon.discountAmount;
      // }
    }

    for (const item of cartDetails) {
      totalPrice += item.items.quantity * item.productDetails.price;
    }

    if (paymentMethod === 'wallet') {
      console.log("Wallet payment selected");

      const wallet = await Wallet.findOne({ userId: new mongoose.Types.ObjectId(userId) });

      if (!wallet || wallet.balance < totalPrice) {
        return res.status(400).json({ error: 'Insufficient funds in the wallet' });
      }

      wallet.balance -= totalPrice;
      await wallet.save();
    }else if (paymentMethod === 'cod' && totalPrice > 2000) {
        // Set the error message in a variable
        
        
        // Return the error message in the JSON response
        return res.redirect('/order/load-checkout')
    }
    
    


    console.log('Total Price:', totalPrice);

    const orderItems = cartDetails.map((item) => ({
      product_id: item.items.product_id,
      quantity: item.items.quantity,
      price: item.productDetails.price
    }));

    // Update the countStock for each product
   // Update the countStock for each product
for (const item of cartDetails) {
  const productId = item.items.product_id;
  const quantityPurchased = item.items.quantity;

  await Product.findByIdAndUpdate(productId, { $inc: { countStock: -quantityPurchased } });
}


if (req.session.couponAmount) {
  totalPrice -= req.session.couponAmount;
}

console.log('Total Price:', totalPrice);

    const order = new Order({
      user_id: userId,
      billingAddress: selectedAddressId,
      totalAmount: totalPrice,
      items: orderItems,
      payment: paymentMethod
    });

    if (!selectedAddressId || !paymentMethod) {
      return res.status(400).json({ error: 'billingAddress and payment are required fields' });
    }

    console.log("Before saving");
    await order.save();

  

    await Cart.findOneAndUpdate(
      { user_id: new mongoose.Types.ObjectId(userId) },
      { $set: { items: [], totalPrice: 0, Tprice: 0 } }
    );

    res.render('thankCheckout');

  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}







//<---------------------------------------------RAZORPAYMENT------------------------------------------------>
const razorpay = new Razorpay({
  key_id: 'rzp_test_m90tBYBDKu8GIf',
  key_secret: '4EH6DyrDsr1A8Tkv79NJOONA'
});

const razorPayment = async (req, res) => {
  try {
    // Get the user's ID from the session
    const userId = new mongoose.Types.ObjectId(req.session.user_id);

    // Find the cart associated with the user
    const cart = await Cart.findOne({ user_id: userId });

    if (!cart) {
      return res.status(404).json({ success: false, error: "Cart not found" });
    }

    // Retrieve the total price from the cart
    let totalPrice = cart.totalPrice;
    if (req.session.couponAmount) {
      totalPrice -= req.session.couponAmount;
    }


    console.log("Total Price:", totalPrice);

    // Convert the total amount to paisa (multiply by 100) and make sure it's an integer
    const amountInPaisa = totalPrice * 100;

    const orderOptions = {
      amount: amountInPaisa, // Razorpay expects amount in paisa
      currency: 'INR',
      receipt: 'Order._id',
      // payment_capture: 1
    };

    // Create a Razorpay order
    const order = await razorpay.orders.create(orderOptions);

    // Send the response back to the client
    res.status(200).json(order);
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ success: false, error: "Error creating Razorpay order" });
  }
};

















// Function to calculate the total amount based on product details
// const calculateTotalAmount = (userCart) => {
//     return userCart.reduce((total, item) => total + item.items.quantity * item.items.price, 0);
// };




const checkoutComplete= async (req,res)=>{
  try{

    res.render('thankCheckout');

  }catch(error){
    console.log(error);
  }
};


const loadOrder= async(req,res)=>{
  try{

    const userId= req.session.user_id;
    const orderData= await Order.aggregate([
      {
        $match:{user_id:new mongoose.Types.ObjectId(userId)}
      },
      {
        $unwind:"$items"
      },
      {
        $lookup:{
          from :"products",
          localField:"items.product_id",
          foreignField:"_id",
          as:"productDetails"

        }
      },
      {
        $unwind:"$productDetails"
      },
      {
        $sort:{createdAt:-1}
      }
     

      

    ])
 
    // console.log("orderdata:",orderData)
    res.render('order',{orderData,user:userId})

  }catch(error){
    console.log(error);
  }
}







const viewOrder = async (req, res) => {
  try {
    const orderId = new mongoose.Types.ObjectId(req.query.orderId);
    const productId = new mongoose.Types.ObjectId(req.query.productId);

    console.log("Converted orderId:", orderId);
    console.log("Converted productId:", productId);

    const userId = req.session.user_id;

    const orderView = await Order.aggregate([
      {
        $match: { _id: orderId },
      },
      { $unwind: "$items" },
      {
        $match: {
          "items.product_id": productId,
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "items.product_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: "$product",
      },
    ]);

    console.log("orderview:", orderView);

    let billingAddress = "";
    if (orderView.length > 0) {
      billingAddress = orderView[0].billingAddress;
    }

    const userAddress = await Address.findOne(
      {
        user_id: userId,
      },
      { Addresses: 1 }
    ).exec();

    console.log("userAddress:", userAddress);

   

    if (!userAddress) {
      console.log("User address not found");
      // Handle the case where userAddress is null
    }

    res.render("viewDetails", { orderView, billingAddress, userAddress, user: req.session.user_id });

    if (orderView.length === 0) {
      console.log("No matching documents found");
    } else {
      console.log("Found matching documents");
    }
  } catch (error) {
    console.error("Error during aggregation:", error);
    // Handle the error and send an appropriate response to the client
    res.status(500).send("Internal Server Error");
  }
};





const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Step 1: Retrieve Order Details
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const userId = order.user_id;
    const totalRefundAmount = order.totalAmount;

    // Step 2: Refund Products
    for (const item of order.items) {
      const productId = item.product_id;
      const quantityCanceled = item.quantity;

      // Increment the countStock for each product
      await Product.findByIdAndUpdate(productId, { $inc: { countStock: quantityCanceled } });
    }

    // Step 3: Find User's Wallet
    const userWallet = await Wallet.findOne({ userId });
    if (!userWallet) {
      return res.status(404).json({ message: "User's wallet not found" });
    }

    // Step 4: Update Wallet Balance
    if (order.payment === 'razorpay' || order.payment === 'wallet') {
      // Refund the amount to the wallet only if payment method is Razorpay or Wallet
      userWallet.balance += totalRefundAmount;
    }

    // Step 5: Save Transaction
    const refundTransaction = {
      type: 'refund',
      amount: totalRefundAmount,
      bigBalance: userWallet.balance,
      timestamp: new Date()
    };

    // Push the new transaction into the user's wallet
    userWallet.transactions.push(refundTransaction);
    await userWallet.save();

    // Step 6: Update Order Status to 'cancelled'
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: { "items.$[].status": "cancelled" } }, // Corrected syntax
      { new: true }
    );
    
    console.log("updateOrder",updatedOrder)

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.redirect('/order/load-order');
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};




// <--------------------Invoice Generation----------------------->

const invoiceGeneration=async(req,res)=>{
  try{
    const user=req.session.user_id;
    const userData= await User.findById(user);
   
    const orderId=req.query.id;
    console.log('orderid:',orderId)
    const order= await Order.findById(new mongoose.Types.ObjectId(orderId))
    

    const orderData=await Order.aggregate([
      {
        $match:{_id:new mongoose.Types.ObjectId(orderId)}
      },
      {
       $unwind:'$items'

      },
      {
        $lookup:{
          from:"products",
          localField:"items.product_id",
          foreignField:"_id",
          as:"productDetails"
        }
      },
      {
        $unwind:"$productDetails"
      }


    ])
    

    const addressId= orderData[0].billingAddress  ;
    const addressData = await Address.findOne({user_id: user});
    const deliveryAddress = addressData.Addresses.find(address => address._id.toString() === addressId)
    console.log('delivery:',deliveryAddress)
    const data = {
      order: orderData,
      user: userData,
      address: deliveryAddress
    }
    const ejsTemplate = path.resolve(__dirname, "../views/users/invoice.ejs");
    const ejsData = await ejs.renderFile(ejsTemplate, data);

    

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({ headless: 'new' });   
    const page = await browser.newPage();
    await page.setContent(ejsData, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

    // Close the browser
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=order_invoice.pdf");
    res.send(pdfBuffer);



  }catch(error){
    console.log(error);
  }
}









  


//    <--------------------coupon Management User side-------------->










//checkout address
const checkoutAddress = async (req, res) => {
  try {
    const { name, villa, city, zip } = req.body;
    const userId = req.session.user_id;

    // Check if the user already has an address
    let existingAddress = await Address.findOne({ user_id: userId });

    if (existingAddress) {
      // If the user already has an address, add the new address to the addresses array
      existingAddress.Addresses.push({
        name,
        villaName: villa,
        cityName: city,
        zipcode: zip
      });

      // Save the updated address document
      await existingAddress.save();
    } else {
      // If the user doesn't have an address, create a new Address document
      const newAddress = new Address({
        user_id: userId,
        Addresses: [{
          name,
          villaName: villa,
          cityName: city,
          zipcode: zip
        }]
      });

      // Save the new address document
      await newAddress.save();
    }

    res.redirect('/order/load-checkout');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};






//apply coupon

const applyCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        console.log("code", code); // Check if the code is received properly

        const coupon = await Coupon.findOne({ couponCode: code });
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found.' });
        }

        const currentDate = new Date();
        if (currentDate > coupon.expirationDate) {
            return res.status(400).json({ message: 'Coupon has expired.' });
        }

        const couponDiscount = coupon.discountAmount;
        console.log("couponDiscount:", couponDiscount);
        req.session.couponAmount=couponDiscount;

        const user=req.session.user_id;
        console.log("usss",user)
        const cart = await Cart.find({ user_id: user });
        let totalPrice = 0;
        cart.forEach(item=>{ totalPrice += item.totalPrice;})
        

        console.log("CAA",cart)

        console.log("cartAmount",totalPrice)


      

 
        

        // Send the discount amount to the client
        return res.json({ amount: couponDiscount,totalAmount:totalPrice });
    } catch (error) {
        console.error('Error applying coupon:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};
 


const removeCoupon = async (req, res) => {
  try {
   
    delete req.session.couponAmount; // Remove the couponAmount from session
    const user = req.session.user_id;

    const cart = await Cart.find({ user_id: user });
    
    let totalPrice = 0;
    cart.forEach(item => { totalPrice += item.totalPrice; });

    return res.json({ message: "Coupon removed", totalAmount: totalPrice });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { removeCoupon };






 


  module.exports={
    loadCheckout,
    placeOrder,
    checkoutComplete,
    loadOrder,
    viewOrder,
    cancelOrder,
    razorPayment,
   
    invoiceGeneration,
    checkoutAddress,

    //apply coupon
    applyCoupon,
    removeCoupon

   
   

  }