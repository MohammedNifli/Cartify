const express=require('express')
const admin_route=express.Router();
const session=require('express-session')
const adminController = require('../controllers/adminController');

admin_route.use(express.urlencoded({ extended: true }));

admin_route.use(session({
    secret: 'mysecret-key',
   
    resave: false,
    saveUninitialized: true,
    
  }));
  
 


 admin_route.post('/adminreg', adminController.loadRegister);
 admin_route.get('/adminlogin',adminController.adloadLogin);
 admin_route.post('/adminlog',adminController.verifyLogin);
 admin_route.get('/adlogout',adminController.adminLogout);
 admin_route.get('/admindash',adminController.adminDashboard);

 //block user
 admin_route.post('/block/:userId', adminController.blockUser);
admin_route.post('/unblock/:userId', adminController.unblockUser);

//order Management
admin_route.get('/order-list',adminController.loadingOrder);

admin_route.get('/order-detail',adminController.orderDetail);
admin_route.post('/status',adminController.statusChange);



//coupon managemment

admin_route.get('/coupon-pg',adminController.couponPage);
admin_route.get('/coupon-list',adminController.couponList);
admin_route.post('/add-coupon',adminController.addCoupon);



//sales

admin_route.get('/salespg',adminController.salesReport);
admin_route.get('/sales-excel',adminController.excelDownload);

admin_route.get('/sales-pdf',adminController.pdfDownload)

//chart

admin_route.get('/admin-dash',adminController.adminDash);


//Refferal

admin_route.get('/refferal',adminController.refferalPage);
admin_route.get('/add-ref',adminController.addRefferalpg);
admin_route.post('/add-refferal',adminController.addToRefferal)







  module.exports=admin_route;
