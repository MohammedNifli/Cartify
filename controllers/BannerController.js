const Admin= require('../models/adminModel');
const User= require('../models/userModel');
const Category=require('../models/categoryModel');
const Cart=require('../models/cartModel');
const Order=require('../models/orderModel');


const { Types: { ObjectId } } = require('mongoose');
const Address = require('../models/addressModel');

const mongoose = require('mongoose');
const Product = require('../models/productModel');

const Banner=require('../models/bannerModel');



const multer = require('multer');
const path = require('path');





const loadBanner=async(req,res)=>{
  try{

    res.render('banner')

  }catch(error){
    console.log(error)
  }


}


//multer for bannerImage

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/banner'); 
    },
    filename: function (req, file, cb) {
      
      cb(null, Date.now() + path.extname(file.originalname));
    },
  })
  
  const upload = multer({ storage: storage });







//adding banner  datas

const addBanner = async (req, res) => {
    try {
        const { title, description, startDate, endDate } = req.body; 
        const bannerImage = req.file.filename; // Filename of the uploaded banner image


        const bannerData=await Banner.findOne({title:req.body.title})
        if(bannerData){
            res.send('success:false')
        }else{

        // Create a new banner object
        const newBanner = new Banner({
            title: title,
            description: description,
            startDate: startDate,
            endDate: endDate,
            bannerImage: bannerImage,
        });


        // Save the new banner to the database
        await newBanner.save();
    }

        // Redirect to a success page or another appropriate location
        res.redirect('/admin/banner/banner-list'); // Example response
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


const bannerList = async (req, res) => {
    try {
        // Extract page number from query parameters, default to 1 if not provided
        const page = parseInt(req.query.page) || 1;
        const itemsPerPage = 1; // Number of items per page

        // Calculate the skip count based on the current page number
        const skipCount = (page - 1) * itemsPerPage;

        // Query banners from the database with pagination
        const bannerData = await Banner.find({})
                                        .skip(skipCount)
                                        .limit(itemsPerPage);

        // Count total number of banners
        const totalBanners = await Banner.countDocuments({});

        
        const totalPages = Math.ceil(totalBanners / itemsPerPage);

        res.render('bannerList', { 
            bannerData: bannerData,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.log(error);
    }
}


const deleteBanner = async (req, res) => {
    try {
       
        const bannerId = req.params.id;

        const deletedBanner = await Banner.findByIdAndDelete(bannerId);

        // Check if the banner was successfully deleted
        if (!deletedBanner) {
            // If the banner does not exist, return a 404 Not Found error
            return res.status(404).json({ error: 'Banner not found' });
        }

        // If the banner was successfully deleted, send a success response
        res.redirect('/admin/banner/banner-list')
        
    } catch (error) {
        // If an error occurs during the deletion process, handle it
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
    
};



const editBanner=async(req,res)=>{
    try{
        const bannerId=req.params.id
        const bannerData=await Banner.findById({_id:bannerId});
       
        res.render('editBanner',{bannerData})

    }catch(error){
        console.log(error)
    }
}




const updateBanner = async (req, res) => {
    try {
        const bannerId = req.params.id;
        const updateBannerData = {
            ...(req.body.title && { title: req.body.title }),
            ...(req.body.description && { description: req.body.description }),
            ...(req.body.startDate && { startDate: req.body.startDate }),
            ...(req.body.endDate && { endDate: req.body.endDate }),
        };

        // Check if there's no file uploaded
        if (!req.file) {
            // Update banner data without uploading a new file
            const updatedBanner = await Banner.findByIdAndUpdate(
                bannerId,
                { $set: updateBannerData },
                { new: true } // Return the updated document
            );

            // Check if the banner was not found
            if (!updatedBanner) {
                return res.status(404).json({ error: 'Banner not found' });
            }

            return res.status(200).json({ message: 'Banner updated successfully', banner: updatedBanner });
        } else {
            // Handle the case where a new file is uploaded
            const bannerImage = req.file.filename;
            updateBannerData.bannerImage = bannerImage;

            const updatedBanner = await Banner.findByIdAndUpdate(
                bannerId,
                { $set: updateBannerData },
                { new: true }
            );

            if (!updatedBanner) {
                return res.status(404).json({ error: 'Banner not found' });
            }

            return  res.redirect('/admin/banner/banner-list')
            
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};




module.exports={
    loadBanner,
    addBanner,
    upload,
    bannerList,
    deleteBanner,
    editBanner,
    updateBanner
    

}