const express=require('express');

const cart_route= express.Router();
const session=require('express-session');

const cartController= require('../controllers/cartController');


cart_route.use(express.urlencoded({ extended: true }));

cart_route.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));
  const userAuth=require('../middleware/userAuth')
  const checkBlock=require("../middleware/checkBlock")


//loadcart 
cart_route.get('/load-cart',checkBlock,userAuth.isLogin,cartController.loadCart);
cart_route.post('/add-to-cart/:id',cartController.addToCart);

cart_route.post('/update-cart', cartController.updateCart);
cart_route.post('/remove-product',cartController.removeProduct)


//load checkout


module.exports= cart_route;