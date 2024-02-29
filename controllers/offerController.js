const Product=require('../models/productModel');
const User=require("../models/userModel");
const Cart=require('../models/cartModel');
const mongoose = require('mongoose');
const Category=require('../models/categoryModel')
const CategoryOffer=require('../models/categoryOffer');
const productOffer=require('../models/productOffer');




const loadOffer = async (req, res) => {
    try {
        const page = req.query.page || 1; // Get page number from query parameter, default to 1
        const limit = 3; // Set limit per page

        const skip = (page - 1) * limit;

        // Query data with pagination
        const categories = await CategoryOffer.find()
            .populate('category')
            .limit(limit)
            .skip(skip)
            .exec();

        // Get total count of items
        const totalCount = await CategoryOffer.countDocuments();

        // Calculate total pages
        const totalPages = Math.ceil(totalCount / limit);
        const categoryData=await Category.find({isDeleted:false});

        // Render the view with paginated data and pagination information
        res.render('offers', { categories, totalPages, currentPage: page,categoryData });

    } catch (error) {
        console.log(error);
        // Handle error
        res.status(500).send('Internal Server Error');
    }
};



const addOffer = async (req, res) => {
    try {
        // Extract offer data from the request body
        const { catselct, dispercentage, starDate, enDate } = req.body;

        // Validate the incoming data
        if (!catselct || !dispercentage || !starDate || !enDate) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Convert discountPercentage to a number
        const discount = parseInt(dispercentage);

        // Validate discountPercentage
        if (isNaN(discount) || discount < 1) {
            return res.status(400).json({ message: 'Discount percentage must be a positive integer.' });
        }

        // Find if an offer already exists for the category
        let existingOffer = await CategoryOffer.findOne({ category: catselct });

        // If an offer already exists, update its fields
        if (existingOffer) {
            existingOffer.discountPercentage = discount;
            existingOffer.validFrom = new Date(starDate);
            existingOffer.validUntil = new Date(enDate);
            await existingOffer.save();
        } else {
            // Create a new offer document
            const newOffer = new CategoryOffer({
                category: catselct,
                discountPercentage: discount,
                validFrom: new Date(starDate),
                validUntil: new Date(enDate)
            });

            // Save the offer document to the database
            await newOffer.save();
        }

        // Calculate new prices for products in the category
        const productsToUpdate = await Product.find({ category_id: catselct });
        for (const product of productsToUpdate) {
            // Calculate new price based on the discount percentage
            const newPrice = product.price - (product.price * (discount / 100));
            
            // Update the product price
            await Product.findByIdAndUpdate(product._id, {
                $set: {
                    'CatOffer.catOfferPrice': newPrice,
                    'CatOffer.catDiscount': dispercentage
                }
            });
        }

        
        return res.redirect('/admin/offer/loadoffer')
    } catch (error) {
        console.error('Error adding offer:', error);
        return res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
};


const deleteCatOffer = async (req, res) => {
    try {
        // Extract offer ID and category ID from the request query parameters
        const offerId = req.query.id;
        const catId = req.query.catid;

        // Find and delete the category offer document
        await CategoryOffer.findByIdAndDelete(offerId);

        // Retrieve products under the specified category
        const productsToUpdate = await Product.find({ category_id: catId });
        console.log("productsToUpdate",productsToUpdate);

        // Update each product to remove the CatOffer fields
        for (const product of productsToUpdate) {
            // Check if the product has a category offer and it matches the offer being deleted
            if (product.CatOffer ) {
                // If it matches, unset the CatOffer field
                await Product.findByIdAndUpdate(product._id, {
                    $unset: {
                        'CatOffer': 1
                    }
                });
            }
        }

        // Respond with success message
        return res.redirect('/admin/offer/loadoffer')
    } catch (error) {
        console.error('Error deleting offer:', error);
        return res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
}








// <---------------------product offer------------------------------->


const loadProffer = async (req, res) => {
    try {
        const page = req.query.page || 1; // Get page number from query parameter, default to 1
        const limit = 20; // Set limit per page

        const skip = (page - 1) * limit;

        // Query products with pagination
        const proData = await Product.find({ isDeleted: false })
            .limit(limit)
            .skip(skip)
            .exec();

        // Query product offers with pagination
        const prooo = await productOffer.find()
            .populate('product')
            .limit(limit)
            .skip(skip)
            .exec();

        // Get total count of products and product offers
        const totalProducts = await Product.countDocuments({ isDeleted: false });
        const totalOffers = await productOffer.countDocuments();

        // Calculate total pages for products and product offers
        const totalProductPages = Math.ceil(totalProducts / limit);
        const totalOfferPages = Math.ceil(totalOffers / limit);

        // Render the view with paginated data and pagination information
        res.render('prOffer', { proData, prooo, totalProductPages, totalOfferPages, currentPage: page });

    } catch (error) {
        console.log(error);
        // Handle error
        res.status(500).send('Internal Server Error');
    }
};


const addProffer = async (req, res) => {
    try {
        const { product, discountPercentage, validFrom, validUntil } = req.body;

        // Find if an offer already exists for the product
        let existingOffer = await productOffer.findOne({ product });

        // Create a new offer document
        const newOffer = new productOffer({
            product,
            discountPercentage,
            validFrom,
            validUntil
        });

        // If an offer already exists, update its fields
        if (existingOffer) {
            existingOffer.discountPercentage = discountPercentage;
            existingOffer.validFrom = validFrom;
            existingOffer.validUntil = validUntil;
            await existingOffer.save();
        } else {
            // Save the new offer to the database if no offer exists
            await newOffer.save();
        }

        const productDetails = await Product.findById(product);
        const productOfferPrice = productDetails.price - (productDetails.price * (discountPercentage / 100));


        await Product.findByIdAndUpdate(product, {
            $set: {
                'PrOffer.prodOfferPrice': productOfferPrice,
                'PrOffer.prodDiscount': discountPercentage
            }
        });
        
        await productDetails.save();

        // Respond with a success message and the details of the offer
        res.redirect("/admin/offer/proffer")
    } catch (error) {
        console.error('Error adding offer:', error);
        // Respond with an error message
        res.status(500).json({ message: 'Internal server error' });
    }
};


//delete

const deletePrOffer = async (req, res) => {
    try {
        // Extract the offer ID from the request parameters
        const offerId = req.query.deleId;
        const proId = req.query.proId;

        // Delete the product offer document by directly passing the offerId
        await productOffer.findByIdAndDelete(offerId);

        // Update products with the deleted offer
        await Product.updateMany({ _id: proId }, { $unset: { 'PrOffer': 1 } });
         res.redirect("/admin/offer/proffer");

        // Respond with a success message
        
    } catch (error) {
        console.error('Error deleting product offer:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};






 





module.exports={
    loadOffer,
    addOffer,
    loadProffer,
    addProffer,
    deleteCatOffer,
    deletePrOffer


}