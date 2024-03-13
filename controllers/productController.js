const Product=require('../models/productModel');
// In productController.js
const Category = require('../models/categoryModel');
const mongoose = require('mongoose');

const sharp=require('sharp');
const Cart=require('../models/categoryModel')



  const path = require('path');
  const { find } = require('../models/adminModel');

   const loadAdp=async(req,res)=>{
    try{
        const categories = await Category.find();
      res.render('addProduct',{categories})
  
    }catch(error){
      console.log(error)
    }
  }
  // multerConfig.js







  const addProduct = async (req, res) => {
    try {
        console.log("hiiiiii");

        // Check if there are files uploaded
        let arrImages = [];
        if (req.files) {
            for (let i = 0; i < req.files.length; i++) {
                // Use sharp to resize and crop the image
                const croppedBuffer = await sharp(req.files[i].path)
                    .resize({ width: 306, height: 408, fit: sharp.fit.cover })
                    .toBuffer();
        
                const filename = `cropped_${req.files[i].originalname}`; // Corrected string interpolation
                arrImages.push(filename);
        
                // Save the cropped image
                await sharp(croppedBuffer).toFile(`uploads/products/${filename}`); // Corrected file path
            }
        }

        // Check if product with the same description already exists
        const existingProduct = await Product.findOne({ description: req.body.description });
        if (existingProduct) {
            return res.status(400).send("A product with the same description already exists.");
        }

        // Create a new product
        const product = new Product({
            productName: req.body.productName,
            description: req.body.description,
            price: req.body.price,
            color: req.body.color,
            countStock: req.body.count,
            category_id: req.body.category,
            productImages: arrImages,
            isDeleted: false
        });

        // Save the new product to the database
        const product_data = await product.save();
        
        // Redirect to product list page after successful addition
        res.redirect("/admin/product/list-pro");
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, msg: "Internal Server Error" });
    }
};






// const loadHome = async (req, res) => {
//     try {
//         const Id = new mongoose.Types.ObjectId(req.params.id); // Convert id to ObjectId
//         const category_Data = await Category.find({});
//         const product_Data = await Product.findById(Id);

//         res.render('productDetails', { product: product_Data, category: category_Data, user: req.session.user_id });
//     } catch (error) {
//         console.log(error);
//         res.status(500).send('Internal Server Error');
//     }
// }

const { ObjectId } = require('mongodb');

const loadHome = async (req, res) => {
    try {
       
        console.log(req.params.id);
        const Id = req.params.id;

        // Ensure that Id is a valid ObjectId before passing it to findById
        if (!ObjectId.isValid(Id)) {
            throw new Error('Invalid ObjectId');
        }

        const category_Data = await Category.find({});
        const product_Data = await Product.findById(Id).populate('PrOffer CatOffer');
        console.log("product_Data",product_Data)

       

        // Render the product details page with updated product data
        res.render('productDetails', { product: product_Data, category: category_Data, user: req.session.user_id });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};




const viewProduct = async (req, res) => {
    try {
        // Extract page number from query parameters, default to 1 if not provided
        const page = parseInt(req.query.page) || 1;
        const itemsPerPage = 3; // Number of items per page

        // Calculate the skip count based on the current page number
        const skipCount = (page - 1) * itemsPerPage;

        // Query products from the database with pagination
        const product_data = await Product.find({isDeleted:false})
                                           .skip(skipCount)
                                           .limit(itemsPerPage);

        // Count total number of products
        const totalProducts = await Product.countDocuments({isDeleted:false});

        // Calculate total pages based on total products and items per page
        const totalPages = Math.ceil(totalProducts / itemsPerPage);

        res.render('productView', { 
            product: product_data,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.log(error);
    }
}







const unlistPage = async (req, res) => {
    try {
        // Extract page number from query parameters, default to 1 if not provided
        const page = parseInt(req.query.page) || 1;
        const itemsPerPage = 1; // Number of items per page

        // Calculate the skip count based on the current page number
        const skipCount = (page - 1) * itemsPerPage;

        // Query products from the database with pagination
        const product_data = await Product.find({ isDeleted: true }) // Query documents with isDeleted set to true
                                           .skip(skipCount)
                                           .limit(itemsPerPage);

        // Count total number of products with isDeleted set to true
        const totalProducts = await Product.countDocuments({ isDeleted: true });

        // Calculate total pages based on total products and items per page
        const totalPages = Math.ceil(totalProducts / itemsPerPage);

        res.render('productUnlist', { 
            product: product_data,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.log(error);
    }
}




const productUnlist = async (req, res) => {
    try {
        const product_id = req.query.id;
        const deleteproduct = await Product.findByIdAndUpdate(product_id, { isDeleted: true });
        res.redirect('/admin/product/list-pro');
    } catch (error) {
        console.log(error);
    }
}



const listProduct = async (req, res) => {
    try {
        const product_id = req.query.id;
        const restoreProduct = await Product.findByIdAndUpdate(product_id, { isDeleted: false });
        res.redirect('/admin/product/unlist-pg');
    } catch (error) {
        console.log(error);
    }
}





const editProduct = async (req, res) => {
    try {
        const productId = req.query.id;

         

        const category = await Category.find();
        const exproduct = await Product.findById(productId);  // Use productId directly

        if (exproduct) {
            res.render('productEdit', { product: exproduct });
        } else {
            res.redirect('/admin/product/list-pro');
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}



// const updateProduct = async (req, res) => {
//     try {
//         const productid = req.params.id;



//         console.log("ID:",productid)

//         // Check if a file is uploaded
//         const imagePaths = req.files.map((image) => image.filename);

        
//         const updateFields = {
//             ...(req.body.productName && { productName: req.body.productName }),
//             ...(req.body.countInStock && { countInStock: req.body.count }),
//             ...(req.body.color && { color: req.body.color }),
//             ...(req.body.category_id && {category_id:req.body.category}),
//             ...(req.body.description && { description: req.body.description }),
//             ...(req.body.price && { price: req.body.price }),
//             ...(imagePaths.length > 0 && { images: imagePaths }),
//         };
//         console.log("update:",updateFields)

//         const updatedProduct = await Product.findByIdAndUpdate(
//             productid,
//             { $set: updateFields },
//             { new: true }
//         );
//         console.log("Updated Product:", updatedProduct);
        

//         // Check if the product was not found
//         if (!updatedProduct) {
//             return res.status(404).json({ error: 'Product not found' });
//         }

//         // Redirect to the product edit page or another appropriate location
//         res.redirect('/admin/product/edit-pro');
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// };
const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id; // Extract product ID from request parameters

        // Construct the update fields based on request body
        const updateFields = {};
        console.log(req.body.count)
        
        // Add fields to updateFields if they exist in the request body
        if (req.body.productName) {
            updateFields.productName = req.body.productName;
        }
        if (req.body.count) {
            updateFields.countStock = req.body.count;
        }
        if (req.body.color) {
            updateFields.color = req.body.color;
        }
        if (req.body.category) {
            updateFields.category_id = req.body.category;
        }
        if (req.body.description) {
            updateFields.description = req.body.description;
        }
        if (req.body.price) {
            updateFields.price = req.body.price;
        }

        // Check if any files are uploaded
        if (req.files && req.files.length > 0) {
            const imagePaths = []; // Array to store the filenames of processed images

            // Process each uploaded image using Sharp
            for (let i = 0; i < req.files.length; i++) {
                try {
                    // Use sharp to resize and crop the image
                    const croppedBuffer = await sharp(req.files[i].path)
                        .resize({ width: 306, height: 408, fit: 'cover' }) // Adjust dimensions and fit as needed
                        .toBuffer();

                    const filename = `cropped_${req.files[i].originalname}`;

                    // Save the cropped image to the destination directory
                    await sharp(croppedBuffer).toFile(`uploads/products/${filename}`);

                    // Add the filename to the array
                    imagePaths.push(filename);
                } catch (error) {
                    console.error(`Error processing image ${req.files[i].originalname}:`, error);
                }
            }

            // Update the productImages field with the filenames of the processed images
            updateFields.productImages = imagePaths;
        }

        // Update the product in the database
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { $set: updateFields }, // Use $set operator to update specific fields
            { new: true } // Return the updated document
        );
        
        

        // Check if the product was not found
        if (!updatedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Redirect to the product edit page or another appropriate location
        res.redirect('/admin/product/edit-pro');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};





const deleteImage=async(req,res)=>{
    try{



    }catch(error){
        console.log(error)
    }
}


   


module.exports={
    loadAdp,
    addProduct,
    viewProduct,
    productUnlist,
    editProduct,
    listProduct,
    unlistPage,
    updateProduct,
    loadHome,
    deleteImage
   
    
}
