const express=require('express');

const wallet_route=express.Router();
const session=require('express-session');

const walletController= require('../controllers/walletController')

wallet_route.use(express.urlencoded({ extended: true }));

wallet_route.use(session({
    secret: 'aarodum-parayalley',
    resave: false,
    saveUninitialized: true,
    
  }));

  wallet_route.get('/walletpg',walletController.wallet);

  wallet_route.post('/add',walletController.addToWallet);
  wallet_route.post('/addrazor',walletController.razorPayment);
  wallet_route.post('/withdraw',walletController.withdrawl);

  //history page
  wallet_route.get('/history',walletController.showHistory);

  module.exports=wallet_route;