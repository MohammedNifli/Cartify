const express=require('express');
const product_route=express.Router();
const session=require('express-session');
const productController=require('../controllers/productController');
const categoryController=require('../controllers/categoryController')

product_route.use(express.urlencoded({ extended: true }));
product_route.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 }
  }));

  const multer=require('multer');
  const path=require('path');

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/products'); 
    },
    filename: function (req, file, cb) {
      
      cb(null, Date.now() + path.extname(file.originalname));
    },
  })
  
  const uploadd = multer({ storage: storage });
  
  
  
   product_route.get('/addpage',productController.loadAdp);
   product_route.post('/addproduct', uploadd.array('productImages', 5), productController.addProduct);
   product_route.get('/list-pro',productController.viewProduct); 
   product_route.get('/delete-pro',productController.productUnlist);
   product_route.get('/undo-pro',productController.listProduct)
   product_route.get('/edit-pro',productController.editProduct);
   product_route.get('/unlist-pg',productController.unlistPage)
   product_route.post('/update-pro/:id', uploadd.array('image', 5), productController.updateProduct);


   product_route.post('/dele-img',productController.deleteImage)
   



  module.exports=product_route
  
  