const Admin = require('../models/adminModel');
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const Order = require('../models/orderModel');
const Address = require('../models/addressModel'); // Adjust the path as per your project structure
const Coupon = require("../models/couponModel");
const Product=require('../models/productModel');
const Category =require('../models/categoryModel')
const moment = require('moment')
//pdf
const { IronPdf } = require('@ironsoftware/ironpdf');
const fs = require('fs');

const Refferal=require('../models/refferalModel')

const mongoose = require('mongoose');
//excel

const ExcelJS = require('exceljs');

const XLSX = require('xlsx');
// const { jsPDF } = require('jspdf');
// const puppeteer = require('puppeteer');







const loadRegister = async (req, res) => {
    try {
        const { name, email, password, is_admin } = req.body;



        const admin = new Admin({ name, email, password, is_admin });
        const adminData = await admin.save();
        console.log("data is", adminData)
        if (adminData) {
            res.render('adminlogin')
            console.log(adminData)
        } else {
            res.redirect('register');
        }



    } catch (error) {
        console.log(error)
    }
}


const adloadLogin = async (req, res) => {
    try {
        res.render('adminLogin')

    } catch (error) {
        console.log(error);
    }

}

const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const adminData = await Admin.findOne({ email: email });

        if (adminData) {
            // Compare the provided password with the stored password
            if (password === adminData.password) {
                // Passwords match, set the session and render the admin home page
                req.session.admin = adminData._id;
                res.redirect('/admin/admin-dash');
                console.log(req.session.admin);
            } else {
                // Passwords do not match, redirect back to the admin login page
                res.redirect('/adminLogin');
            }
        } else {
            // Admin not found for the provided email, redirect back to the admin login page
            res.redirect('/adminLogin');
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};





const adminLogout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/admin/adminLogin')
        console.log('admin logout successfully completed')

    } catch (error) {
        console.log(error);
    }
}

// const adminDashboard = async (req, res) => {
//     try {
//         const userData = await User.find({ is_admin: false });

//         res.render('customers', { users: userData })


//     } catch (error) {
//         console.log(error);
//     }
// }


// Number of items per page

const adminDashboard = async (req, res) => {
    try {
        // Extract page number from query parameters, default to 1 if not provided
        const page = parseInt(req.query.page) || 1;
        const itemsPerPage = 5; // Number of items per page

        // Calculate the skip count based on the current page number
        const skipCount = (page - 1) * itemsPerPage;

        // Query customers from the database with pagination
        const userData = await User.find({ is_admin: false })
                                    .skip(skipCount)
                                    .limit(itemsPerPage);

        // Count total number of customers
        const totalUsers = await User.countDocuments({ is_admin: false });

        // Calculate total pages based on total users and items per page
        const totalPages = Math.ceil(totalUsers / itemsPerPage);

        res.render('customers', { 
            users: userData,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.log(error);
    }
}








const blockUser = async (req, res) => {
    try {
        const id = req.params.userId;
        console.log(id);
        await User.findByIdAndUpdate({ _id: id }, { $set: { isBlocked: true } });


        res.redirect('/admin/admindash');
    } catch (error) {
        console.error('Error blocking user:', error);
        res.status(500).send('Internal server error');
    }
};

const unblockUser = async (req, res) => {
    try {
        const id = req.params.userId;
        await User.findByIdAndUpdate({ _id: id }, { $set: { isBlocked: false } });

        res.redirect('/admin/admindash');
    } catch (error) {
        console.error('Error unblocking user:', error);
        res.status(500).send('Internal server error');
    }
};

// order loading in admin side
const loadingOrder = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Extract page number, default to 1 if not provided
        const itemsPerPage = 7; // Number of items per page

        // Calculate the skip count based on the current page number
        const skipCount = (page - 1) * itemsPerPage;

        // Query orders from the database with pagination
        const orders = await Order.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" }
        ])
            .skip(skipCount)
            .limit(itemsPerPage);

        // Count total number of orders
        const totalOrders = await Order.countDocuments();

        // Calculate total pages based on total orders and items per page
        const totalPages = Math.ceil(totalOrders / itemsPerPage);

        res.render('orderList', { 
            orders,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};




const orderDetail = async (req, res) => {

    try {
        const orderId = req.query.orderid;
        console.log("orderId:", req.query.orderid);
        const userId = req.session.user_id;

        const orderDetails = await Order.aggregate([{
            $match: { _id: new mongoose.Types.ObjectId(orderId) },

        },
        {
            $lookup: {
                from: "products",
                localField: "items.product_id",
                foreignField: "_id",
                as: "product"
            }
        },
        {
            $unwind: "$product"

        }


        ])


        console.log("orderDetail:", orderDetails)
        let billingAddress = "";
        if (orderDetails.length > 0) {
            billingAddress = orderDetails[0].billingAddress;
        }

        const userAddress = await User.findById(
            new mongoose.Types.ObjectId(userId)
        );

        console.log("userAddress:", userAddress);

        //   if (!userAddress) {
        //     console.log("User address not found for user ID:", userId);
        //     // Handle the case where the user's address is not found
        //   } else {
        //     console.log("User address:", userAddress);
        //     // Continue processing with the user's address
        //   }


        // if (!userAddress) {
        //   console.log("User address not found");
        //   // Handle the case where userAddress is null
        // }
        res.render('detailView', { orderDetails, billingAddress, userAddress })



    } catch (error) {
        console.log(error)
    }
}


const statusChange = async (req, res) => {
    try {
        const pro = req.body.productId;
        const order = req.body.orderId;
        const status = req.body.status;

        const updateOrder = await Order.findOneAndUpdate(
            {
                _id: order,
                "items.product_id": pro
            },
            {
                $set: { "items.$.status": status }
            },
            { new: true }
        );

        console.log("updateOrder:", updateOrder);
        res.status(200).send("Status updated successfully");

    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
}



//-----------------------coupons---------------------->

const couponPage = async (req, res) => {
    try {
        res.render('addCoupons')

    } catch (error) {
        console.log(error)
    }
}

const addCoupon = async (req, res) => {
    try {
        const { couponCode, minTotal, discountPercentage, expirationDate, startingDate, maxTry } = req.body;

        const coupon = new Coupon({
            couponCode: couponCode,
            discountPercentage: discountPercentage,
            startingDate: startingDate,
            expirationDate: expirationDate,
            minTotal: minTotal,
            maxTry: maxTry // Assuming you also want to save maxTry if it's provided in the request body
        });

        await coupon.save();
        res.redirect("/admin/coupon-list");
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}







const couponList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Extract page number, default to 1 if not provided
        const itemsPerPage = 10; // Number of items per page

        // Calculate the skip count based on the current page number
        const skipCount = (page - 1) * itemsPerPage;

        // Query coupons from the database with pagination
        const couponData = await Coupon.find()
                                       .skip(skipCount)
                                       .limit(itemsPerPage);

        // Count total number of coupons
        const totalCoupons = await Coupon.countDocuments();

        // Calculate total pages based on total coupons and items per page
        const totalPages = Math.ceil(totalCoupons / itemsPerPage);

        res.render('couponPage', { 
            couponData,
            currentPage: page,
            totalPages: totalPages
        });

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};


 

//Sales Report
let customSalesWithProductInfo

const salesReport = async (req, res) => {
    try {
        // Retrieve start and end dates from the query parameters
        const startDate = req.query.start;
        const endDate = req.query.end;

        // Convert start and end dates to JavaScript Date objects
        const startingDate = moment(startDate, 'YYYY-MM-DD').startOf('day').toDate();
        const endingDate = moment(endDate, 'YYYY-MM-DD').endOf('day').toDate();

        console.log("ennnnnnd:", endingDate);

        // Aggregate to get sales report data
        customSalesWithProductInfo = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startingDate, $lte: endingDate }, // Filter orders within the date range
                },
            },
            {
                $sort: { createdAt: -1 } // Sort orders by createdAt field in descending order (latest first)
            },
            {
                $unwind: "$items", // Unwind the items array
            },
            {
                $lookup: {
                    from: 'products', // Lookup products collection
                    localField: 'items.product_id',
                    foreignField: '_id',
                    as: 'productInfo',
                },
            },
            {
                $unwind: "$productInfo", // Unwind the productInfo array
            },


        ]);

        // Render the sales report template and pass the data
        res.render('sales', { salesReportData: customSalesWithProductInfo, startDate, endDate });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};




const excelDownload = async (req, res) => {
    try {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(customSalesWithProductInfo);
        XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');
        XLSX.writeFile(wb, 'sales_report.xlsx');
        res.download('sales_report.xlsx');

    } catch (error) {
        console.log(error)
    }
}

const path = require('path');
const { log } = require('console');

const pdfDownload = async (req, res) => {
    try {
       
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF');
    }
}



//admin Dash load
const adminDash=async(req,res)=>{
    try{
      
        const orderData= await Order.find({})
        const orderCount=orderData.length;
      
        const productData=await Product.find({});
        const productCount=productData.length
        console.log("kkkkkk",productCount)
        
        const userData=await User.find({});
        const  userCount=userData.length;
        const categoryData= await Category.find({});
        const totalCategory=categoryData.length;
        

        const totalRevenue=await Order.aggregate([
            {
                $group:{
                    _id:null,
                    totalAmount:{$sum:"$totalAmount"}
                }
            }
        ])
        console.log("revenuee:",totalRevenue);
        const [result] = totalRevenue;
        const { totalAmount } = result;

        const total = await Order.aggregate([
            {
                $unwind: "$items" // Unwind the items array
            },
            {
                $match: {
                    "items.status": "cancelled" // Match documents where items.status is "cancelled"
                }
            },
            {
                $group: {
                    _id: null,
                    totalCancelledAmount: {
                        $sum: { $multiply: ["$items.price", "$items.quantity"] } // Calculate total cancelled amount
                    },
                    totalCount: { $sum: 1 } // Count the number of cancelled items
                }
            },
            {
                $project: {
                    _id: 0,
                    totalCancelledAmount: 1,
                    totalCount: 1
                }
            }
        ]);
         

        const totalCancelledAmount = total[0].totalCancelledAmount;
        
        const Revenue = totalAmount - totalCancelledAmount;
      
        const cancelledOrder = total[0].totalCount;
       
        const dailyOrderData = await Order.aggregate([
            {
              $match: {
                createdAt: {
                  $gte: new Date(moment().subtract(30, "days").startOf("day")),
                }, // Adjust time interval as needed
              },
            },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                orderCount: { $sum: 1 },
              },
            },
            {
              $sort: { _id: 1 },
            },
          ]);
         

          const monthlyOrderData = await Order.aggregate([
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                orderCount: { $sum: 1 },
              },
            },
            {
              $sort: { _id: 1 },
            },
          ]);
          const dailyLabels = dailyOrderData.map((item) => item._id);
          const dailyData = dailyOrderData.map((item) => item.orderCount);
          console.log("dailyLabels",dailyLabels)
          console.log("dailyData",dailyData);
          const monthlyLabels = monthlyOrderData.map((item) => item._id);
          const monthlyData = monthlyOrderData.map((item) => item.orderCount);
      
          console.log("dailyOrderData",dailyOrderData)
          console.log("labelsmotnh:", monthlyLabels)
          console.log("datamonth:", monthlyData)      


        res.render('adhome',{totalRevenue, orderCount ,userCount ,productCount, totalCategory ,Revenue,cancelledOrder, dailyLabels,
            dailyData,
            monthlyLabels,
            monthlyData,});


    }catch(error){
        console.log(error);

    }

};



// refferal Controller

const refferalPage=async(req,res)=>{
    try{
        const referalData=await Refferal.find({});
        res.render('refferal',{referalData})

    }catch(error){
        console.log(error)
    }
}


const addRefferalpg=async(req,res)=>{
    try{

        res.render('ADDrefferal')


    }catch(error){
    console.log(error)

    }
}

const addToRefferal=async(req,res)=>{
    try{

        const refferalBonusq=req.body.refBonus;
        const newuser=req.body.sbonus;

        const reference= new Refferal({
            refferalBonus:refferalBonusq,
            signupBonus:newuser
        })

        reference.save();

        res.redirect('/admin/refferal')



    }catch(error){
        console.log(error)
    }
}




module.exports = {
    loadRegister,
    adloadLogin,
    verifyLogin,
    adminLogout,
    adminDashboard,
    blockUser,
    unblockUser,
    loadingOrder,
    orderDetail,
    statusChange,
    couponPage,
    couponList,
    addCoupon,
    salesReport,
    excelDownload,
    pdfDownload,
    adminDash,
    refferalPage,
    addRefferalpg,
    addToRefferal
    
}
