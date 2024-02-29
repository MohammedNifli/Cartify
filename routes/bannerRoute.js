const express = require('express');
const banner_route = express.Router();
const session = require('express-session');

const bannerController = require('../controllers/BannerController');

banner_route.use(express.urlencoded({ extended: true }));

banner_route.use(session({
    secret: 'aarodum-parayalley',
    resave: false,
    saveUninitialized: true
}));

banner_route.get('/add-bannerpg', bannerController.loadBanner);
banner_route.post('/add-banner', bannerController.upload.single('bannerImage'), bannerController.addBanner);


banner_route.get('/banner-list',bannerController.bannerList);

//delete banner
banner_route.get('/delete-ban/:id',bannerController.deleteBanner);

banner_route.get('/edit-ban/:id',bannerController.editBanner);

banner_route.post('/update-ban/:id', bannerController.upload.single('bannerImage'), bannerController.updateBanner);

module.exports = banner_route;
