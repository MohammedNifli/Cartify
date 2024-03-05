const express=require('express')
const route=express.Router();
const session=require('express-session')
const userController=require('../controllers/userController')
const config = require('../config/config');

const productController=require('../controllers/productController');

route.use(express.urlencoded({ extended: true }));

route.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));


  const userAuth=require('../middleware/userAuth')
  const checkBlock=require("../middleware/checkBlock")

  

  


route.get('/ecom',checkBlock,userController.homeLoad);




route.get('/register',userController.loadRegister)
route.post('/register',userController.insertUser)
// route.post('/getbill',userController.insertUser)
route.post('/verifyotp',userController.verifyOTP);
route.post('/res-otp',userController.resendOTP);


route.get('/login',userAuth.isLogout,userController.loadLogin)
route.post('/login',userController.verifyLogin)


route.get('/logout',userController.userLogout)
route.get('/home-pro/:id',productController.loadHome);


//Forgot Password
route.get('/forgot-page',userAuth.isLogout,userController.forgotPage);
route.post('/forgot-post',userController.checkingEmail)
route.post('/verify-otp',userController.verifyForgototp);
route.post('/reset-password',userController.passwordConfirmation);

route.get('/user-profile',userAuth.isLogin,checkBlock,userAuth.isLogin,userController.userProfile);



//user profile
route.get('/edit-profile',userAuth.isLogin,checkBlock,userController.editProfile);
route.post('/update-profile/:id',userController.updateProfile);


//user adress management

route.get('/user-address',userAuth.isLogin,checkBlock,userController.addressLoad);
route.post('/addaddress',userController.addAddress);
route.post('/delete-address/:id',userController.deleteAddress);
route.post('/edit-address/:id',userController.editAddress);




//change Password

route.get('/pass-page',userAuth.isLogin,checkBlock,userController.changePasswordpg);
route.post('/change-pass',userController.checkingpassword)

//wishlist

route.get('/wishlist',checkBlock,userAuth.isLogin,userController.wishlist);

route.get('/addwish/:productId', checkBlock,userController.addWishlist); // Corrected route definition

route.get('/remove-wishlist/:productId', checkBlock,userController.removeWishlistItem);   




route.get('/refer-link',userController.referalUserside);

//search
route.get('/search',userAuth.isLogin,userController.search);

route.get('/filterAndSortProducts',userAuth.isLogin,userController.filter);

route.get('/sort-data',userAuth.isLogin,userController.sortData);










module.exports=route;


  