const Admin= require('../models/adminModel');
const User= require('../models/userModel');
const Category=require('../models/categoryModel');
const Cart=require('../models/cartModel');
const Order=require('../models/orderModel');

const Coupon=require('../models/couponModel');
const AppliedCoupon = require('../models/appliedCoupon');

const shortid = require('shortid');

const { Types: { ObjectId } } = require('mongoose');

const Address = require('../models/addressModel');

const mongoose = require('mongoose');

const Product = require('../models/productModel');


const Razorpay=require("razorpay");
const Wallet = require('../models/walletModel');


const wallet = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.session.user_id);

        // Find wallet data for the user
        const WalletData = await Wallet.findOne({ userId: userId });

        if (WalletData) {
            console.log("Wallet Data:", WalletData.balance);
            res.render('wallet', { user: req.session.user_id, balance: WalletData.balance });
        } else {
            // Handle case where wallet data doesn't exist for the user
            console.log("User does not have wallet data yet.");
            res.render('wallet', { user: req.session.user_id, balance: 0 });
        }
    } catch (error) {
        console.log(error);
        // Handle other errors gracefully
        res.status(500).send("Internal Server Error");
    }
}




const addToWallet = async (req, res) => {
    try {
        console.log("kooooooo");
        const addamount = req.body.amount; // Use consistent variable name `amount`
        const userId = new mongoose.Types.ObjectId(req.session.user_id);

        // Find the wallet associated with the user
        let wallet = await Wallet.findOne({ userId: userId });

        if (!wallet) {
            // If the wallet doesn't exist, create a new wallet document
            wallet = new Wallet({
                userId: userId,
                balance: addamount, // Use the correct variable `amount`
                transactions: [{
                    type: 'credit',
                    amount: addamount,
                    bigBalance: addamount, // Set initial bigBalance as the current balance
                    timestamp: new Date()
                }]
            });

            // Save the new wallet document
            await wallet.save();

            // Send a response indicating success
            return res.status(200).json({ message: 'New wallet created and amount added successfully', wallet });
        }

        // Store the current balance
        const currentBalance = wallet.balance;

        // Update the balance
        wallet.balance += Number(addamount); 

        // Push the transaction with the stored current balance as bigBalance
        wallet.transactions.push({
            type: 'credit',
            amount: addamount,
            bigBalance: wallet.balance, // Update bigBalance with the new balance
            timestamp: new Date()
        });

        // Save the updated wallet
        await wallet.save();

        // Send a response indicating success
        return res.redirect("/wallet/walletpg");
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to add amount to wallet' });
    }
};




const razorpay = new Razorpay({
    key_id: 'rzp_test_m90tBYBDKu8GIf',
    key_secret: '4EH6DyrDsr1A8Tkv79NJOONA'
  });
  
  const razorPayment = async (req, res) => {
    try {
      // Get the user's ID from the session
      const userId = new mongoose.Types.ObjectId(req.session.user_id);
   const amount=req.body.amount
      //
      
      // Convert the total amount to paisa (multiply by 100) and make sure it's an integer
      

      const orderOptions = {
        amount: Math.ceil(amount * 100), // Razorpay expects amount in paisa
          currency: 'INR',
          receipt: 'order_reciept_id_2', // Use the generated receipt ID
          // payment_capture: 1
      };

  
      // Create a Razorpay order
      const order = await razorpay.orders.create(orderOptions);
  
      // Send the response back to the client
      res.json(order);
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({ success: false, error: "Error creating Razorpay order" });
    }
  };
  


  const withdrawl = async (req, res) => {
    try {
        // Get the withdrawal amount from the request body
        const amount = req.body.amount;

        // Ensure user is authenticated and retrieve user's ID from session
        const userId = new mongoose.Types.ObjectId(req.session.user_id);

        // Find the user's wallet based on their ID
        const wallet = await Wallet.findOne({ userId: userId });

        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        // Check if the user has sufficient balance for withdrawal
        if (wallet.balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance for withdrawal' });
        }

        // Record the withdrawal transaction
        wallet.transactions.push({
            type: 'debit',
            amount: amount,
            bigBalance: wallet.balance - amount, // Record the big balance before the withdrawal
            timestamp: new Date()
        });

        // Deduct the withdrawal amount from the wallet balance
        wallet.balance -= amount;

        // If the user withdraws the full amount, set the balance to zero
        if (wallet.balance === 0) {
            wallet.balance = 0;
        }

        // Save the updated wallet document
        await wallet.save();

        // Send a success response
         return res.redirect("/wallet/walletpg");
    } catch (error) {
        console.error('Error withdrawing from wallet:', error);
        return res.status(500).json({ error: 'Failed to withdraw from wallet' });
    }
};


const showHistory = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.session.user_id);
        const wallet = await Wallet.findOne({ userId: userId });

        if (!wallet) {
            return res.status(404).json({ message: "Wallet not found" });
        }

        // Sort transactions by timestamp in descending order (latest first)
        wallet.transactions.sort((a, b) => b.timestamp - a.timestamp);

        console.log('history', wallet);
        res.render('history', { wallet });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};



module.exports={
    wallet,
    addToWallet,
    razorPayment,
    withdrawl,
    showHistory

}
