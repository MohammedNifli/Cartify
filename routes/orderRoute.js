const express=require('express');
const order_route=express.Router();
const session=require('express-session')

const orderController=require('../controllers/orderController')
order_route.use(express.urlencoded({ extended: true }));

order_route.use(session({
    secret: 'aarodum-parayalley',
    resave: false,
    saveUninitialized: true
  }));

  const userAuth=require('../middleware/userAuth')

order_route.get('/load-checkout',userAuth.isLogin,orderController.loadCheckout);

order_route.post('/add-order',orderController.placeOrder);

order_route.get('/thank-checkout',userAuth.isLogin,orderController.checkoutComplete);
order_route.get('/load-order',userAuth.isLogin,orderController.loadOrder);
order_route.get('/details',userAuth.isLogin,orderController.viewOrder);
order_route.post('/remove/:orderId', orderController.cancelOrder);

//oredr Management

// order_route.get('/order-list',orderController.loadingOrder);

order_route.post('/get-payment',orderController.razorPayment);



//coupon routes
order_route.post('/apply-coupon',orderController.applyCoupon);
order_route.post('/remove-coupon',orderController.removeCoupon);
// order_route.get('/coupon',orderController.couponShow);

//invoice
order_route.get('/invoice',orderController.invoiceGeneration);


//checkout Address

order_route.post('/check-address',orderController.checkoutAddress);



module.exports=order_route