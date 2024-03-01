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
    const totalPrice = cartDetails.reduce((total, item) => {
      return total + (item.items.quantity * item.productDetails.price);
    }, 0);

    const coupons = await Coupon.find();
    
    // Pass the address data and other necessary information to the checkout EJS template
    res.render('checkOut', {
      addresses: userAddress ? userAddress.Addresses : [], // Pass the addresses array or an empty array if it doesn't exist
      cartDetails,
      user: req.session.user_id,
      totalPrice,
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

    req.session.couponApplied = false;

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
    const totalPrice = cart.totalPrice;

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
      bigBalance: userWallet.balance, // Store the balance before the refund
      timestamp: new Date()
    };

    // Push the new transaction into the user's wallet
    userWallet.transactions.push(refundTransaction);
    await userWallet.save();

    // Step 6: Update Order Status to 'cancelled'
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: { status: "cancelled" } }, // Update order status to 'cancelled'
      { new: true }
    ); 

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



// const applyCoupon = async (req, res) => {
//   try {
//      const {code}  = req.body;
//     const userId = new mongoose.Types.ObjectId(req.session.user_id);



    

//     // Find the coupon based on the provided coupon code
//     const coupon = await Coupon.findOne({ couponCode: code });
//     if (!coupon || req.body.code !== coupon.couponCode) {
//       return res.status(400).json({ message: 'Invalid coupon code.' });
//     }

//     // Check if the coupon is already applied by the user
//     const appliedCoupon = await AppliedCoupon.findOne({ userId:userId, couponId: coupon._id });
//     if (appliedCoupon) {
//       return res.status(400).json({ message: 'Coupon already applied by the user.' });
//     }

//     if (!coupon) {
//       return res.status(404).json({ message: 'Coupon not found.' });
//     }

//     // Check if the coupon has expired
//     const currentDate = new Date();
//     if (currentDate > coupon.expirationDate) {
//       return res.status(400).json({ message: 'Coupon has expired.' });
//     }

//     // Retrieve the user's cart
//     const cart = await Cart.findOne({ user_id: userId });
//     if (!cart) {
//       return res.status(404).json({ message: 'Cart not found for the user.' });
//     }

//     // Apply coupon only if the cart total is greater than or equal to the minTotal specified in the coupon
//     if (cart.totalPrice < coupon.minTotal) {
//       return res.status(400).json({ message: 'Cart total does not meet the minimum requirement for the coupon.' });
//     }

//     // Apply the discount
//     const discountAmount = (coupon.discountPercentage / 100) * cart.totalPrice;
//     const discountedTotalPrice = cart.totalPrice - discountAmount;

//     // Update the cart with the discounted total and mark the coupon as applied
//     cart.totalPrice = discountedTotalPrice;
//     cart.couponId=coupon._id
//     cart.couponApplied = true;

//     // Increment the currentTry counter
//     coupon.currentTry += 1;
//     coupon.discountAmount= discountAmount;
//     await coupon.save();

//     // Save the updated cart
//     await cart.save();

//     // Create a new applied coupon record
//     const newAppliedCoupon = new AppliedCoupon({ userId, couponId: coupon._id });
//     await newAppliedCoupon.save();

//     req.session.couponApplied = true;

//     return res.status(200).json({ message: 'Coupon applied successfully.', updatedCart: cart });
//   } catch (error) {
//     console.error('Error applying coupon:', error);
//     return res.status(500).json({ message: 'Internal server error.' });
//   }
// };



// const cancelCoupon = async (req, res) => {
//   try {
//     const userId = req.session.user_id;

//     // Remove the applied coupon record associated with the user
//     await AppliedCoupon.findOneAndDelete({ userId });
//     req.session.couponApplied = false;

//     // Retrieve the user's cart
//     const cart = await Cart.findOne({ user_id: userId });

//     // Check if cart exists
//     if (!cart) {
//       return res.status(404).json({ success: false, message: 'Cart not found for the user.' });
//     }

//     const couponid = new mongoose.Types.ObjectId(cart.couponId);

//     // Retrieve the coupon details if needed for the calculation
//     const coupon = await Coupon.findOne({ _id: couponid });

//     // Check if the coupon exists
//     if (!coupon) {
//       return res.status(404).json({ success: false, message: 'Coupon not found for the user.' });
//     }

//     // Here, you need to recalculate the cart total price without the coupon discount
//     // For example, if you're using a coupon discountPercentage, you would subtract the discount from the total price
//     // Update the cart's total price
//     // const discountAmount = (coupon.discountPercentage / 100) * cart.Tprice;
//     // const updatedTotalPrice = cart.totalPrice + discountAmount;

//     // Save the updated cart
//     cart.totalPrice = cart.Tprice;

//     // Save the updated cart
//     await cart.save();

//     return res.status(200).json({ success: true, message: 'Applied coupon canceled successfully.', updatedCart: cart });
//   } catch (error) {
//     console.error('Error canceling coupon:', error);
//     return res.status(500).json({ success: false, message: 'Internal server error.' });
//   }
// };

// const couponShow = async (req, res) => {
//   try {
//     // Fetch all coupons from the Coupon collection
//     const coupons = await Coupon.find({});
    
//     // Log the retrieved coupons to the console
//     console.log('Coupons:', coupons);
    
//     // Render the couponPage view
//     res.render('couponPage',{coupon:coupons});
//   } catch (error) {
//     // Handle any errors that occur during the process
//     console.log(error);
//     res.status(500).send('Internal Server Error');
//   }
// };







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

const applyCoupon =async(req,res)=>{
  try{

    const {code} =req.body
    console.log("cpcde",code);

    const coupon = await Coupon.findOne({ couponCode: code });

        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found.' });
        }

        const currentDate = new Date();
        if (currentDate > coupon.expirationDate) {
            return res.status(400).json({ message: 'Coupon has expired.' });
        }

        const couponDiscount=coupon.discountAmount;

        return res.json({ amount: couponDiscount });


      } catch (error) {
        console.error('Error applying coupon:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}






 


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
    applyCoupon

   
   

  }