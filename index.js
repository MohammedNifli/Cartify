

const  mongoose=require('mongoose')
mongoose.connect('mongodb+srv://mohammednifliap:wf9IkIOudGjhn9ZQ@test-pro-db.sbonlqr.mongodb.net/?retryWrites=true&w=majority&appName=test-pro-db');
const dotenv=require('dotenv')

dotenv.config()
console.log(process.env.EMAIL);

const express = require('express');
const app = express();
const port = 5000;

app.set('view engine', 'ejs');

app.use(express.static('assets'));
app.use(express.static('adminassets'));
app.use(express.static('uploads'));







// app.get('/ecom', (req, res) => {
//     res.render('base');
// });

app.use((req,res,next)=>{
    if(req.path.startsWith('/admin')){
        app.set('views', './views/admin');
    }else{
        app.set('views', './views/users');


    }
    next();

})

app.use((req,res,next)=>{
    res.set('Cache-control','no-store,no-cache');
    next();
  });





 const userRoute=require('./routes/userRoute');
 const adminRoute=require('./routes/adminRoute');
 const categoryRoute = require('./routes/categoryRoute');
 
const productRoute = require('./routes/productRoute');
const cartRoute =require ('./routes/cartRoute');
//order route
const  orderRoute=require('./routes/orderRoute');

const walletRoute=require('./routes/walletRoute');

const bannerRoute=require('./routes/bannerRoute');

const offerRoute=require('./routes/offerRoute');

// const errorHandler = require('./middleware/error500'); // Import the error handling middleware

// app.use(errorHandler);

app.use(express.json());

 app.use('/',userRoute);
 app.use('/admin',adminRoute);
 //category route
 app.use('/admin/category',categoryRoute)
//product route
app.use('/admin/product',productRoute);
//cart
app.use('/cart',cartRoute);

//Order
app.use('/order',orderRoute);


//wallet
app.use('/wallet',walletRoute);

//banner
app.use('/admin/banner',bannerRoute);

//offer route
app.use('/admin/offer',offerRoute)
 


app.listen(port,()=>{
    console.log(`server running on http://localhost:5000/ecom`)
})