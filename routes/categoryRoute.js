const express=require('express');
const category_route= express.Router();
const session=require('express-session')

category_route.use(express.urlencoded({ extended: true }));

category_route.use(session({
    secret: 'aarodum-parayalley',
    resave: false,
    saveUninitialized: true,
    
  }));

  const adminAuth=require('../middleware/adminAuth');
  
  const categoryController=require('../controllers/categoryController');

  category_route.get('/add-category',categoryController.loadCategory)

  category_route.post('/adding-category',categoryController.upload.single('catimage'),categoryController.addCategory)

  category_route.get('/view-cat',categoryController.viewCategory);

  category_route.get('/cat-delete', categoryController.deleteCategory);

  category_route.get('/edit-cat',categoryController.editCategory);

  // category_route.post('/edit-cat/:id', categoryController.updateCategory);

  category_route.post('/edit-cat/:id', categoryController.upload.single('image'), categoryController.updateCategory);

  category_route.get('/cat-unlist',categoryController.unlistPage);
  category_route.get('/cat-list', categoryController.listCategory);
  






  module.exports=category_route