const Admin= require('../models/adminModel');
const User= require('../models/userModel');
const Category=require('../models/categoryModel');
const multer=require('multer')
const path = require('path');



const sharp=require('sharp')


   

const loadCategory=async(req,res)=>{
  try{
    res.render('category',{})

  }catch(error){
    console.log(error)
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/category'); 
  },
  filename: function (req, file, cb) {
    
    cb(null, Date.now() + path.extname(file.originalname));
  },
})

const upload = multer({ storage: storage });




// const addCategory = async (req, res) => {
//   try {
//     // Convert the categoryName to lowercase for case-insensitive comparison
//     const categoryName = req.body.catname.toLowerCase();

//     // Check if a category with the same name already exists
//     const existingCategory = await Category.findOne({ categoryName });

//     // If a category with the same name already exists, return an error response
//     if (existingCategory) {
//       return res.status(400).send({ success: false, msg: "Category already exists in the collection" });
//     }

//     // Create a new category object
//     const category = new Category({
//       categoryName,
//       categoryImage: req.file ? req.file.filename : undefined,
//     });

//     // Save the new category to the database
//     const cat_data = await category.save();
//     res.status(200).send({ success: true, msg: "Category added successfully", data: cat_data });
//   } catch (error) {
//     console.error(error);
//     res.status(400).send({ success: false, msg: error.message });
//   }
// }

const addCategory = async (req, res) => {
  if (req.file) {
    try {
        // Use sharp to resize and crop the image
        const resizedImageBuffer = await sharp(req.file.path)
            .resize({ width: 306, height: 408, fit: sharp.fit.cover })
            .toBuffer();

        const filename = `cropped_${req.file.originalname}`;

        // Save the resized image
        await sharp(resizedImageBuffer).toFile(`uploads/category/${filename}`);

        // Create a new category object
        const category = new Category({
            categoryName: req.body.catname.toLowerCase(),
            categoryImage: filename,
            // Add other category properties as needed
        });

        // Save the new category to the database
        const cat_data = await category.save();

        return res.status(200).send({ success: true, msg: "Category added successfully", data: cat_data });
    } catch (error) {
        console.error("Error in addCategory:", error);
        return res.status(400).send({ success: false, msg: "Error adding category", error: error.message });
    }
} else {
    return res.status(400).send({ success: false, msg: "No file uploaded" });
}

}



























const viewCategory = async (req, res) => {
  try {
    // Extract page number from query parameters, default to 1 if not provided
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 2; // Number of items per page

    // Calculate the skip count based on the current page number
    const skipCount = (page - 1) * itemsPerPage;

    // Query categories from the database with pagination
    const fetchAllCategories = await Category.find({isDeleted:false})
                                             .skip(skipCount)
                                             .limit(itemsPerPage);

    // Count total number of categories
    const totalCategories = await Category.countDocuments({isDeleted:false});

    // Calculate total pages based on total categories and items per page
    const totalPages = Math.ceil(totalCategories / itemsPerPage);

    res.render('categoryList', { 
      categories: fetchAllCategories,
      currentPage: page,
      totalPages: totalPages
    });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
}

//category unlist page
const unlistPage = async (req, res) => {
  try {
    // Extract page number from query parameters, default to 1 if not provided
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 1; // Number of items per page

    // Calculate the skip count based on the current page number
    const skipCount = (page - 1) * itemsPerPage;

    // Query categories from the database with pagination
    const fetchAllCategories = await Category.find({ isDeleted: true })
                                             .skip(skipCount)
                                             .limit(itemsPerPage);

    // Count total number of categories where isDeleted is true
    const totalCategories = await Category.countDocuments({ isDeleted: true });

    // Calculate total pages based on total categories and items per page
    const totalPages = Math.ceil(totalCategories / itemsPerPage);

    // Render the categoryUnlist template with categories and pagination data
    res.render('categoryUnlist', { 
      categories: fetchAllCategories,
      currentPage: page,
      totalPages: totalPages
    });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
}




const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.query.id;
    const deletecat = await Category.findByIdAndUpdate(categoryId, { isDeleted: true });
    console.log("deleted cat details:", deletecat);
    res.redirect('/admin/category/view-cat');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

//list category list

const listCategory = async (req, res) => {
  try {
    const categoryId = req.query.id;
    const deletecat = await Category.findByIdAndUpdate(categoryId, { isDeleted: false });
    
    res.redirect('/admin/category/cat-unlist');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};




const editCategory = async (req, res) => {
  try {
      const id = req.query.id; // Use req.query.id to get the ID from the URL parameters
     
      const category_data = await Category.findById(id );
      console.log("category:",category_data)
      
      
      

      if (category_data) {
          res.render('editCategory', { category:category_data});
      } else {
          res.redirect('/admin/category/view-cat');

          res.send()
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server  Error' });
  }
};


const updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id; // Use req.params.id to get the ID from the URL parameters

    // Check if a file was uploaded
    if (!req.file) {
      // Handle the case where no file is uploaded
      const updateCatfields = {
        ...(req.body.catname && { categoryName: req.body.catname }),
      };

      const category = await Category.findByIdAndUpdate(categoryId, updateCatfields, { new: true });

      console.log(updateCatfields);
      res.redirect('/admin/category/view-cat');
      return;
    }

    // If a file is uploaded, proceed with processing
    const imagePath = req.file.filename;

    const updateCatfields = {
      ...(req.body.catname && { categoryName: req.body.catname }),
      ...(imagePath && { categoryImage: imagePath }),
    };

    const category = await Category.findByIdAndUpdate(categoryId, updateCatfields, { new: true });

    console.log(updateCatfields);
    res.redirect('/admin/category/view-cat');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



 




module.exports={
  loadCategory,
    addCategory,
    upload,
    viewCategory,
    deleteCategory,
    editCategory,
    updateCategory,
    unlistPage,
    listCategory,
    
}