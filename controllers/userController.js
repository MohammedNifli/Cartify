const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const otpgenerator = require('../utils/otpgenerator');
const mailgen = require('mailgen');
const nodemailer = require('nodemailer');
const Product = require('../models/productModel');
const Category=require('../models/categoryModel');
const Address = require('../models/addressModel');
const Wishlist=require('../models/wishlistModel')
const mongoose=require('mongoose');
const shortId=require('shortid');    
const Refferal=require('../models/refferalModel');

const flash=require('connect-flash')

//wallet
const Wallet =require('../models/walletModel');


const axios=require('axios')


//banner
const Banner=require('../models/bannerModel');



const OTP=require('../models/otpModel')

const homeLoad = async (req, res) => {
    try {
       
        // Find all products and populate the 'PrOffer' and 'CatOffer' fields
        const productData = await Product.find().populate(['PrOffer', 'CatOffer']);
        // console.log(",productData",productData)
        const categoryData = await Category.find({});
        const wishlist = await Wishlist.findOne({ user: req.session.user_id });
        const bannerData = await Banner.find({});

        const loginSuccessParam = req.query.loginSuccess || false;
        // console.log("loginSuccessParam:",loginSuccessParam)
        
        res.render('base', { 
            product: productData, 
            category: categoryData, 
            wishlist: wishlist, 
            user: req.session.user_id, 
            ban: bannerData ,

            loginSuccessParam: loginSuccessParam 
        });
    } catch (error) {
        console.error(error);
        next(error)
        res.status(500).send('Internal Server Error');
    }
};











// Load registration page
const loadRegister = async (req, res) => {
    try {
        const referalId=req.query.refId;
         console.log('referalId:',referalId);

         req.session.referal=referalId;
         console.log( req.session.referal);
        
        res.render('register',{smessage,referalId});
    } catch (error) {
        console.error('Error loading registration page:', error);
        res.status(500).send('Internal Server Error');
    }
};


let gfname,glname,gpassword,gemail,hashedPassword,gcountry;
var otp;
let mail;
let smessage;
let message;





// Inserting a new user, generating OTP, and sending confirmation email
const insertUser = async (req, res) => {
    try {

         

        gfname = req.body.fname;
        glname = req.body.lname;
        gemail = req.body.email;
        gpassword = req.body.password;
        gcountry = req.body.country;

        // Check if the email already exists
        const existingUser = await User.findOne({ email: gemail });
        if (existingUser) {
            
            smessage= "Email already exists";
            return res.redirect('/register');
        }

        // Clear session message
       

        // Generate OTP
        otp = otpgenerator.generateOTP(); // You need to implement this function in 'otpgenerator' module

        await OTP.create({
            email: gemail,
            otp: otp
        });

        // Hash the password before saving it to the database
        hashedPassword = await bcrypt.hash(gpassword, 10);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        });

        const mailOptions = {
            from: 'mohammednifli@gmail.com',
            to: gemail,
            subject: 'Registration Confirmation',
            html: `<p>Your OTP for registration is: ${otp}</p>`,
        };

        // Send registration confirmation email with OTP
        await transporter.sendMail(mailOptions);

        // Render the OTP page
        res.render('otp', { gemail ,error:k});
        console.log(otp)

    } catch (error) {
        console.error('Error in registration:', error);
        res.status(500).send('Internal Server Error');
    }
};



let k;
const verifyOTP = async (req, res) => {
    try {
        const enterotp = req.body.otp;

        // Find the OTP document
        let otpDoc = await OTP.findOne({ email: gemail, otp: enterotp });
        console.log("ottttttttp:", otpDoc);

        if (!otpDoc) {
            // Handle the case when the OTP is invalid
            k = 'Invalid OTP. Please enter the correct OTP.';
            return res.render('otp', { gemail, error: k });
        } else {
            // If the OTP document exists, update its fields
            otpDoc.otp = enterotp;
            otpDoc.updatedAt = new Date();
        
            // Save the OTP document to the OTP collection
            await otpDoc.save();

            // Check if the OTP has expired
            if (otpDoc.expiresAt && otpDoc.expiresAt < new Date()) {
                // OTP has expired
                return res.render('otp', { gemail, error: 'OTP has expired. Please request a new OTP.' });
            }

            // OTP is valid
            const user = new User({
                firstName: gfname,
                lastName: glname,
                password: hashedPassword,
                country: gcountry,
                email: gemail,
                refferalId: shortId.generate(),
                is_admin: 0
            });

            const userData = await user.save();

            //wallet 
            const wallet=new Wallet({
                userId:userData._id,
                balance:0,
                transactions:[]
            })
             wallet.save();



            const referredUser = await User.findOne({refferalId: req.session.referal})
            console.log("refffffffff",referredUser);

           
            const referalOffer= await Refferal.find();
            

            if (referredUser) {
                let referredWallet = await Wallet.findOne({ userId: referredUser._id });
                console.log("Referred Wallets:", referredWallet);
                
                if (referredWallet) {
                    referredWallet = await Wallet.findOneAndUpdate(
                        { userId: referredUser._id },
                        { $inc: { balance: +referalOffer[0].refferalBonus } },
                        { new: true }
                    );
            
                    // Create a new transaction object with required fields
                    const newTransaction = {
                        type: 'credit', // Example type (adjust according to your schema)
                        amount: referalOffer[0].refferalBonus, // Provide the amount
                        bigBalance: 0,
                        description: 'refferalbonus',
                        createdAt: new Date()
                    };
            
                    console.log("newwwww:", newTransaction);
            
                    // Push the new transaction into the transactions array
                    referredWallet.transactions.push(newTransaction);
                    console.log(referredWallet);
            
                    // Save the updated referredWallet document
                    await referredWallet.save();


                    //user wallet
                    const userWallet = await Wallet.findOneAndUpdate(
                        { userId: userData._id },
                        { $inc: { balance: referalOffer[0].signupBonus} },
                        { new: true }
                    );
                    
                    if (userWallet) {
                        const cashCredited = {
                            type: "credit",
                            amount: referalOffer[0].signupBonus,
                            description: 'Sign-Up bonus',
                            createdAt: new Date()
                        };
                    
                        userWallet.transactions.push(cashCredited);
                    
                        await userWallet.save();
                    } else {
                        console.log('User wallet not found');
                    }

                } else {
                    console.log('Referred user wallet not found');
                } 
            }

            if (userData) {
                res.redirect('login');
                console.log('registration successful');
            } else {
                res.render('registration');
                console.log('registration failed');
            }
        }
        
    
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};





const  resendOTP = async (req, res) => {
    try {
        // Delete expired OTPs
        await OTP.deleteMany({ expiresAt: { $lt: new Date() } });

        // Check if the OTP document exists for the user's email
        let existingOTP = await OTP.findOne({ email: gemail });

        if (!existingOTP) {
            // If the OTP document does not exist, create a new OTP document
            const newOTP = otpgenerator.generateOTP();

            // Create a new OTP document for the user
            existingOTP = await OTP.create({
                email: gemail,
                otp: newOTP
            });

            // Send the new OTP to the user's email
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.PASSWORD,
                },
            });

            const mailOptions = {
                from: 'mohammednifli@gmail.com',
                to: gemail,
                subject: 'Resend OTP',
                html: `<p>Your new OTP for registration is: ${newOTP}</p>`,
            };

            // Send OTP via email
            await transporter.sendMail(mailOptions);
            console.log("resend:", newOTP);

            return res.status(200).send('OTP resent successfully');
        }

        // Generate a new OTP
        const newOTP = otpgenerator.generateOTP();

        // Update the existing OTP document with the new OTP
        await OTP.findOneAndUpdate({ email: gemail }, { otp: newOTP });

        // Send the new OTP to the user's email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        });

        const mailOptions = {
            from: 'mohammednifli@gmail.com',
            to: gemail,
            subject: 'Resend OTP',
            html: `<p>Your new OTP for registration is: ${newOTP}</p>`,
        };

        // Send OTP via email
        await transporter.sendMail(mailOptions);
        console.log("resend:", newOTP);

        res.status(200).send('OTP resent successfully');
    } catch (error) {
        console.error('Error in resending OTP:', error);
        res.status(500).send('Internal Server Error');
    }
};














const loadLogin = async (req, res) => {
    try {
        res.render('login',{ message});
       
    } catch (error) {
        console.error('Error loading login page:', error);
        res.status(500).send('Internal Server Error');
    }
};




const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        // Find the user by email
        const finduser = await User.findOne({ email: email });

        // If user not found, render the login page with an error message
        if (!finduser) {
            console.log('User not found');
            return res.render('login', { message: 'Invalid email' });
        }

        // Compare the provided password with the stored hashed password
        const passwordMatch = await bcrypt.compare(password, finduser.password);

        // If passwords don't match, render the login page with an error message
        if (!passwordMatch) {
            console.log('Invalid password');
            return res.render('login', { message: 'Invalid password' });
        }

        // If user is blocked, render the login page with an error message
        if (finduser.isBlocked) {
            console.log('User is blocked');
            return res.render('login', { message: 'Your account is blocked' });
        }

        // Set user session variables
        req.session.user = finduser;
        req.session.user_id = finduser._id;

        // Update the user's online status
        await User.findByIdAndUpdate(finduser._id, { $set: { isOnline: true } });

        // Fetch product and category data
        const productData = await Product.find({});
        const categoryData = await Category.find({});

        // Pass data to the template using res.locals or directly in the render function
        res.locals.user = finduser;
        res.locals.product = productData;
        res.locals.category = categoryData;
       
        // Redirect to the home page with loginSuccess=true query parameter
        return res.redirect('/?loginSuccess=true');
    } catch (error) {
        // If an error occurs, log it and render the login page with an error message
        console.error(error);
        return res.render('login', { message: 'Internal server error' });
    }
};







const userLogout = async (req, res) => {
    try {
        const userId = req.session.user_id;

        if (userId) {
            // Update user's online status to false when they log out
            await User.findByIdAndUpdate(userId, { $set: { isOnline: false } });
        }

        req.session.destroy();
        res.redirect('/login?logoutSuccess=true'); // Set the logout success parameter
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};



//Forgot Password

const forgotPage=async(req,res)=>{
    try{
        res.render('forgotPage')

    }catch(error){
        console.log(error.message)
    }
}


const checkingEmail = async (req, res) => {
    try {
          mail = req.body.email;
        const user_data = await User.findOne({ email: mail });

        if (user_data) {
             otp = otpgenerator.generateOTP(); // You need to implement this function in 'otpgenerator' module

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.PASSWORD,
                },
            });

            const mailOptions = {
                from: 'mohammednifli@gmail.com',
                to: user_data.email, // Use user's email from the database
                subject: 'Registration Confirmation',
                html: `<p>Your OTP for Reset Password is: ${otp}</p>`,
            };

            // Send registration confirmation email with OTP
            await transporter.sendMail(mailOptions);

            // Render the OTP page
            res.render('forgotOtp', { mail });
            console.log(otp);
        }
    } catch (error) {
        console.log(error);
    }
};

const verifyForgototp= async(req,res)=>{
    try{
        const enterotp =req.body.otp;
        if(enterotp==otp){
            res.render('newPassword')
        }else{
            res.render('forgotOtp',{message:"Invalid OTP"})
        }



    }catch(error){
        console.log(error)
    }
}

const passwordConfirmation = async (req, res) => {
    try {
        const newPassword = req.body.newPassword;
        const confirmPassword = req.body.confirmPassword;
      
        if (newPassword === confirmPassword) {
            const user_data = await User.findOne({ email: mail });

            if (user_data) {
                // Update the user's password
                 user_data.password = await bcrypt.hash(confirmPassword, 10);

                // Save the updated user data

                const updatedUser = await user_data.save();

                console.log('updateuser:',updatedUser)

                if (updatedUser) {
                    res.redirect('/login');
                } else {
                    res.render('newPassword', { message: "Error updating password" });
                }
            } else {
                res.render('newPassword', { message: "User not found with the given email" });
            }
        } else {
            res.render('newPassword', { message: "New password and confirm password do not match" });
        }
    } catch (error) {
        console.log(error);
        res.render('newPassword', { message: "Error resetting password" });
    }
};


// user Profile  

const userProfile = async (req, res) => {
    try {
       
        const user = await User.findById({ _id:req.session.user_id });

       
       if(user){
        res.render('userProfile', { user });

       }
     
        

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};



//user updating profile

const editProfile = async (req, res) => {
    try {
        const userId = req.query.id;
        const userData = await User.findById(userId);

        if (userData) {
            res.render('editProfile', { user: userData });
        } else {
            // User not found, you might want to render an error page or redirect
            res.status(404).render('error', { message: 'User not found' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Internal Server Error' });
    }
};



//Edit Profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        console.log('userId:', userId);

        const updatedProfile = {
            ...(req.body.fname && { firstName: req.body.fname }),
            ...(req.body.lname && { lastName: req.body.lname }),
            ...(req.body.email && { email: req.body.email }),
            ...(req.body.country && { country: req.body.country }),
        };

        console.log("fname",req.body.fname);

        console.log("update:", updatedProfile);

        const updatedUser = await User.findByIdAndUpdate(userId, { $set: updatedProfile }, { new: true });
        console.log("updateUser:", updatedUser);

        if (updatedUser) {
            res.redirect('/user-profile');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};



// Adress management

const addressLoad = async (req, res) => {
    try {
        // Get the current user's ID from the session
        const userId = req.session.user_id;

        // Fetch the addresses associated with the current user
        const addresses = await Address.find({ user_id: userId });

        // Render the EJS template with the addresses data
        res.render('address', { addresses ,user:userId});
    } catch (error) {
        console.log(error);
        // Handle errors appropriately
        res.status(500).send('Internal Server Error');
    }
}



//Adding  Address 
const addAddress = async (req, res) => {
    try {
        // Retrieve the user ID from the session
        const userId = req.session.user_id;
   console.log("body name",req.body.name)
        // Validate user ID
        if (!userId) {
            return res.status(401).send('User not authenticated');
        }

        console.log("Received form data for user:", userId);

        const addressData = {
            name: req.body.name,
            villaName: req.body.villa,
            cityName: req.body.city,
            zipcode: req.body.zip,
        };

        

        // Check if name field is provided
        if (!addressData.name) {
            return res.status(400).json({ error: 'Name field is required' });
        }

        // Find the user's address using the user_id
        let userAddress = await Address.findOne({ user_id: userId });

        if (!userAddress) {
            // If the user's address document doesn't exist, create a new one
            userAddress = new Address({
                user_id: userId,
                Addresses: [addressData],
            });
        } else {
            // If the user's address document exists, push the new address to the Addresses array
            userAddress.Addresses.push(addressData);
        }

        // Save the user's address document
        await userAddress.save();
        console.log('Address data saved for user:', userId);

        res.redirect('/user-address');
    } catch (error) {
        console.error('Error saving address:', error);
        res.status(500).send('Internal Server Error');
    }
};








//Deleting Address
const deleteAddress = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const addressId = req.params.id;

        console.log("Deleting address with ID:", addressId, "for user:", userId);

        // Use Mongoose to find and remove the address by its ID
        const result = await Address.findOneAndUpdate(
            { user_id: userId }, // Match the document using user_id field
            { $pull: { Addresses: { _id: addressId } } },
            { new: true }
        );
        
        console.log("Update result:", result);

        if (!result) {
            console.log("Address not found");
            return res.status(404).send('Address not found');
        }

        console.log("Address deleted successfully");
        res.redirect('/user-address');
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).send('Internal Server Error');
    }
};













//change Password
const changePasswordpg=async(req,res)=>{
    try{
      
      res.render('changePassword',{user:req.session.user_id,})


    }catch(error){
        console.log(error);
    }
}

//comparing password
// const bcrypt = require('bcrypt');

const checkingpassword = async (req, res) => {
    try {
        const id = req.session.user_id;
        const userData = await User.findById(id);

        // Check if userData is null before accessing its properties
        if (!userData) {
            return res.json({ msg: "User not found" });
        }

        const currentPass = req.body.currentPassword;
        const newPass = req.body.newPassword;
        const confirmPass = req.body.confirmPassword;

        // Check if the current password provided matches the stored hashed password
        const isPasswordMatch = await bcrypt.compare(currentPass, userData.password);
        if (!isPasswordMatch) {
            return res.json({ msg: "Current password is incorrect" });
        }

        // Check if the new password and confirm password match
        if (newPass !== confirmPass) {
            return res.json({ msg: "New password and confirm password do not match" });
        }

        // Hash the new password before updating
        const hashedNewPassword = await bcrypt.hash(newPass, 10);

        // Update the user's hashed password in the database
        userData.password = hashedNewPassword;

        // Save the updated user to the database
        await userData.save();

        return res.json({ msg: "Password updated successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).send("Internal Server Error");
    }
};



module.exports = {
    checkingpassword
};







//Edit Address
const editAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const userId = new mongoose.Types.ObjectId(req.session.user_id);
        console.log("params:", addressId); // Verify addressId value
        
        // Update the address fields
        const updateFields = req.body;

        // Update the address within the array
        const result = await Address.findOneAndUpdate(
            { "user_id": userId, "Addresses._id": addressId }, // Find the document where user_id matches and Addresses._id matches
            { $set: {
                "Addresses.$.name": updateFields.name,
                "Addresses.$.villaName": updateFields.villa,
                "Addresses.$.cityName": updateFields.city,
                "Addresses.$.zipcode": updateFields.zip
            }},
            { new: true } // Return the modified document
        );

        if (!result) {
            return res.status(404).send("Address not found");
        }

        console.log("Updated address:", result);

        res.redirect('/user-address'); // Redirect to the appropriate page
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}


//Wishlist----------------->

// Assuming you have defined a Wishlist model

const wishlist = async (req, res) => {
    try {
        const userId = req.session.user_id;

        // Find the wishlist items for the current user
        const wishData = await Wishlist.aggregate([
            {
              $match: { user_id: new mongoose.Types.ObjectId(userId) },
            },
            {
              $unwind: "$items",
            },
            {
              $lookup: {
                from: "products",
                localField: "items.product_id",
                foreignField: "_id",
                as: "productDetails",
              },
            },
            {
              $unwind: "$productDetails",
            },
            {
              $match:{'productDetails.isDeleted':false}
            }
          ]);
          
        // Render the wishlist template with the wishlist data
        res.render('wishlist', { wishData });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}





const addWishlist = async (req, res) => {
    try {
        if (!req.session.user_id) {
            res.json({success: false,message: "!User"})
        }
        const userId = req.session.user_id;
        const productId = req.params.productId;

        

        // Retrieve product data from the Product model
        const productData = await Product.findById(productId);
        if (!productData) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Find the user's wishlist document or create a new one if it doesn't exist
        let wishlist = await Wishlist.findOne({ user_id: userId });
        if (!wishlist) {
            wishlist = new Wishlist({ user_id: userId, items: [] });
        }

        // Check if the product is already in the wishlist
        const existingIndex = wishlist.items.findIndex(item => item.product_id.equals(productId));

        if (existingIndex !== -1) {
            // If the product is already in the wishlist, remove it
            wishlist.items.splice(existingIndex, 1);
            await wishlist.save();
            // res.sendStatus(204); // No content response
            res.json({success: true,message: "Product removed from wishlist", isInWishlist: "rem"})
        } else {
            // If the product is not in the wishlist, add it
            wishlist.items.push({ product_id: productId });
            await wishlist.save();
            res.json({success: true,message: "Product has added in wishlist"})
            // res.sendStatus(204); // No content response
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};







const removeWishlistItem = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const productId = req.params.productId;

        // Find the user's wishlist document
        let wishlist = await Wishlist.findOne({ user_id: userId });
        if (!wishlist) {
            return res.json({ error: 'Wishlist not found for the user' });
        }

        // Check if the product exists in the wishlist
        const index = wishlist.items.findIndex(item => item.product_id.equals(productId));
        if (index === -1) {
            return res.json({ error: 'Product not found in wishlist' });
        }

        // Remove the product from the wishlist
        wishlist.items.splice(index, 1);

        // Save the updated wishlist
        await wishlist.save();

        // Respond with success message
        res.redirect('/wishlist')
    } catch (error) {
        console.error('Error removing product from wishlist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};









const referalUserside=async(req,res)=>{
    try{
        const userId=req.session.user_id;
       const userData=await User.findById({_id:new mongoose.Types.ObjectId(userId)})
       console.log("userrrrr:",userData)
        res.render('referalLink',{ref:userData.refferalId})

    }catch(error){
        console.log(error)
    }
}



const search = async (req, res) => {
    try {
        const searchItem = req.query.searchKeyword;
        const page = parseInt(req.query.page) || 1; // Get the current page number from the query parameters, default to 1 if not provided
        const limit = 10; // Number of items per page

        let productData;
        const categories = await Category.find({});
        
        // Count the total number of documents regardless of the search
        const count = await Product.countDocuments({ isDeleted: false });
        const totalPages = Math.ceil(count / limit);

        if (searchItem) {
            const regex = new RegExp(searchItem, 'i');
            const skip = (page - 1) * limit; // Calculate the skip value for pagination

            // Retrieve the products for the current page
            productData = await Product.find({ productName: regex, isDeleted: false })
                                        .skip(skip)
                                        .limit(limit);
        } else {
            // If there's no search keyword, retrieve all products
            productData = await Product.find({ isDeleted: false })
                                        .skip((page - 1) * limit)
                                        .limit(limit);
        }

        res.render('shopPage', { user:req.session.user_id,catData: categories, proData: productData, totalPages: totalPages, currentPage: page });

    } catch (error) {
        console.log("Error searching for products:", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};









const filter = async (req, res) => {
    try {
        const selectedCategories = typeof req.query.categories === 'string' ? req.query.categories.split(',') : [];
        const initialPrice = parseFloat(req.query.initialPrice);
        const upperPrice = parseFloat(req.query.upperPrice);
        const page = parseInt(req.query.page) || 1; // Get the current page number from the query parameters, default to 1 if not provided
        const limit = 10; // Number of items per page

        // Define a filter object for the MongoDB query
        const filterQuery = { category_id: { $in: selectedCategories } };

        // If initialPrice and upperPrice are provided, add them to the filter
        if (!isNaN(initialPrice) && !isNaN(upperPrice)) {
            filterQuery.price = { $gte: initialPrice, $lte: upperPrice };
        } else if (!isNaN(initialPrice)) {
            filterQuery.price = { $gte: initialPrice };
        } else if (!isNaN(upperPrice)) {
            filterQuery.price = { $lte: upperPrice };
        }

        filterQuery.isDeleted = false;

        // Calculate the skip value for pagination
        const skip = (page - 1) * limit;

        // Fetch products from the database based on the filter with pagination
        const products = await Product.find(filterQuery)
                                       .skip(skip)
                                       .limit(limit);

        res.json(products);
    } catch (error) {
        console.error('Error filtering products:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const sortData = async (req, res) => {
    try {
        console.log("koooo")


        const { categories, initialPrice, upperPrice, sortOption } = req.query;

        // Construct the filter query
        const filterQuery = {isDeleted:false};
        if (categories) {
            filterQuery.category_id = { $in: categories.split(',') };
        }
        if (!isNaN(initialPrice) && !isNaN(upperPrice)) {
            filterQuery.price = { $gte: initialPrice, $lte: upperPrice };
        } else if (!isNaN(initialPrice)) {
            filterQuery.price = { $gte: initialPrice };
        } else if (!isNaN(upperPrice)) {
            filterQuery.price = { $lte: upperPrice };
        }

        // Sort the products based on the selected sort option
        let sortQuery = {};
        if (sortOption === 'price') {
            sortQuery = { price: 1 }; // Sort by price low to high
        } else if (sortOption === 'price-desc') {
            sortQuery = { price: -1 }; // Sort by price high to low
        }     

        // Fetch and send the sorted products
        const products = await Product.find(filterQuery).sort(sortQuery);
        res.json(products);
    } catch (error) {
        console.error('Error sorting products:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};



 

 





module.exports = {
    
    loadRegister,
    loadLogin,
    insertUser,
    verifyOTP,
    verifyLogin,
    userLogout,
    homeLoad,
    forgotPage,
    checkingEmail,
    verifyForgototp,
    passwordConfirmation,
    userProfile,
    editProfile,
    updateProfile,
    addressLoad,
    addAddress,
    deleteAddress,
    changePasswordpg,
    checkingpassword,
    editAddress,
    wishlist,
    addWishlist,
    removeWishlistItem,

    //shp&filtering
    // productPage,
    // filteredProducts,
    resendOTP,
    referalUserside,
    search,
    filter,
    // filterByPriceRange,
    // filterByCategoryAndPrice
    sortData,
    // getAllProducts

   
  };
