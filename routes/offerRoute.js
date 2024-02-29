const express=require('express')
const offer_route=express.Router();
const session=require('express-session')
const offerController = require('../controllers/offerController');

offer_route.use(express.urlencoded({ extended: true }));

offer_route.use(session({
    secret: 'mysecret-key',
   
    resave: false,
    saveUninitialized: true,
    
  }));

  offer_route.get('/loadoffer',offerController.loadOffer);
  offer_route.post('/addoffer',offerController.addOffer);
  
  //product Offer
  offer_route.get('/proffer',offerController.loadProffer);
  offer_route.post('/addproffer',offerController.addProffer);

  offer_route.get('/de-cat-of',offerController.deleteCatOffer);
  offer_route.get('/pro-of-delete',offerController.deletePrOffer)



  module.exports=offer_route