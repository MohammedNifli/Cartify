const express=require('express')
const admin_route=express.Router();
const session=require('express-session')
const adminController = require('../controllers/adminController');

admin_route.use(express.urlencoded({ extended: true }));

admin_route.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));


  
 const adminAuth=require('../middleware/adminAuth')


 admin_route.post('/adminreg',adminController.loadRegister);
 admin_route.get('/adminlogin',adminAuth.isLogout,adminController.adloadLogin);
 admin_route.post('/adminlog',adminController.verifyLogin);
 admin_route.get('/adlogout',adminAuth.isLogin,adminController.adminLogout);
 admin_route.get('/admindash',adminAuth.isLogin,adminController.adminDashboard);

 //block user
 admin_route.post('/block/:userId', adminController.blockUser);
admin_route.post('/unblock/:userId', adminController.unblockUser);

//order Management
admin_route.get('/order-list',adminAuth.isLogin,adminController.loadingOrder);

admin_route.get('/order-detail',adminAuth.isLogin,adminController.orderDetail);
admin_route.post('/status',adminController.statusChange);



//coupon managemment

admin_route.get('/coupon-pg',adminAuth.isLogin,adminController.couponPage);
admin_route.get('/coupon-list',adminAuth.isLogin,adminController.couponList);
admin_route.post('/add-coupon',adminController.addCoupon);



//sales

admin_route.get('/salespg',adminAuth.isLogin,adminController.salesReport);
admin_route.get('/sales-excel',adminController.excelDownload);

admin_route.get('/sales-pdf',adminAuth.isLogin,adminController.pdfDownload)

//chart

admin_route.get('/admin-dash',adminController.adminDash);

// admin_route.get('/admin/cat-shart',adminController.categoryChart);


//Refferal

admin_route.get('/refferal',adminController.refferalPage);
admin_route.get('/add-ref',adminController.addRefferalpg);
admin_route.post('/add-refferal',adminController.addToRefferal);

admin_route.post('/refferal/:referralId', adminController.deleteRefferal);






  module.exports=admin_route;
