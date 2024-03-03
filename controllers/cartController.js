const Product=require('../models/productModel');
const User=require("../models/userModel");
const Cart=require('../models/cartModel');
const mongoose = require('mongoose');


const loadCart = async (req, res) => {
  try {
    const currentUser = req.session.user;
    // console.log('current:', currentUser)

    if (!currentUser) {
      return res.redirect('/login');
    }

    // const cartDetails = await Cart.find({user_id: currentUser._id})
    const cartDetails = await Cart.aggregate([
      {
        $match: { user_id: new mongoose.Types.ObjectId(currentUser._id) },
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
    

    
      const hasItemsInCart=cartDetails.length>0

      let totalAmount = 0;
      
    for (const item of cartDetails) {
      // Fetch latest price from the database for each item
      const productId = item.items.product_id;
      const product = await Product.findById(productId);
      const latestPrice = product.price; // Assuming price is stored directly in the product document

      // Update the price of the item in the cart
      item.items.price = latestPrice;

      // Calculate total price for the item
      const itemTotal = item.items.quantity * latestPrice;
      totalAmount += itemTotal;
    }

    // Update the total price of the cart
    const userCart = await Cart.findOneAndUpdate(
      { user_id: currentUser._id },
      { totalPrice: totalAmount },
      { new: true }
    );

    

      
      res.render("Cart", { cartDetails, totalAmount ,user:req.session.user_id,hasItemsInCart});

  } catch (error) {
    console.error("Error in loadCart", error);
    res.status(500).render("error", { error });
  }
};




// const addToCart = async (req, res) => {
//   try {
//     const currentUser = req.session.user; // Assuming user information is stored in the session after login
    
//     if (!currentUser) {
//       return res.status(401).json({ message: "User not logged in" });
//     }

//     const productId = req.params.id;
//     const productData = await Product.findById(productId);
//     if (productData.isDeleted) {
//       console.log('Product is unlisted. Cannot add to cart.');
//       // Remove the unlisted product from the user's cart if it exists
//       await Cart.updateOne(
//         { user_id: currentUser._id },
//         { $pull: { items: { product_id: productId } } }
//       );
//       return res.redirect('/cart/load-cart'); // Redirect the user to a suitable page
//     }

//     let userCart = await Cart.findOne({ user_id: currentUser._id });

//     if (!userCart) {
//       userCart = new Cart({
//         user_id: currentUser._id, // Provide the user_id when creating a new cart
//         items: [],
//         totalPrice: 0,
//       });
//     }

//     const existingProductIndex = userCart.items.findIndex(
//       (item) => item.product_id.equals(productId)
//     );

//     if (existingProductIndex !== -1) {
//       userCart.items[existingProductIndex].quantity += 1;
//       userCart.totalPrice += productData.price;
//       userCart.Tprice += productData.price; 
//     } else {
//       userCart.items.push({
//         product_id: productId,
//         quantity: 1,
//         price: productData.price,
//       });
//       userCart.Tprice+=productData.price;
//       userCart.totalPrice += productData.price;
//     }

//     await userCart.save();

//     console.log('Product added to the cart successfully.');
   
//     res.redirect('/cart/load-cart');

//   } catch (error) {
//     console.log("error from addProduct", error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

const addToCart = async (req, res) => {
  try {
    const currentUser = req.session.user;

    if (!currentUser) {
      return res.status(401).json({ message: "User not logged in" });
    }

    const productId = req.params.id;
    const productData = await Product.findById(productId);

    if (productData.isDeleted) {
      console.log('Product is unlisted. Cannot add to cart.');
      await Cart.updateOne(
        { user_id: currentUser._id },
        { $pull: { items: { product_id: productId } } }
      );
      return res.redirect('/cart/load-cart');
    }

    let userCart = await Cart.findOne({ user_id: currentUser._id });

    if (!userCart) {
      userCart = new Cart({
        user_id: currentUser._id,
        items: [],
        totalPrice: 0,
        Tprice: 0 // Added for the offer price
      });
    }

    const existingProductIndex = userCart.items.findIndex(
      (item) => item.product_id.equals(productId)
    );

    let priceToAdd = productData.price; // Default price to add to the cart

    // Check if the product has CatOffer and PrOffer
    if (productData.CatOffer && productData.PrOffer) {
      // Compare the offer prices
      const catOfferPrice = productData.CatOffer.catOfferPrice;
      const prodOfferPrice = productData.PrOffer.prodOfferPrice;

      if (catOfferPrice < prodOfferPrice) {
        priceToAdd = catOfferPrice;
      } else {
        priceToAdd = prodOfferPrice;
      }

      // Set the offer price in the userCart's Tprice and totalPrice
      userCart.Tprice = priceToAdd;
      userCart.totalPrice = priceToAdd;
    } else if (productData.CatOffer) {
      // If only CatOffer exists
      priceToAdd = productData.CatOffer.catOfferPrice;
      userCart.Tprice = priceToAdd;
      userCart.totalPrice = priceToAdd;
    } else if (productData.PrOffer) {
      // If only PrOffer exists
      priceToAdd = productData.PrOffer.prodOfferPrice;
      userCart.Tprice = priceToAdd;
      userCart.totalPrice = priceToAdd;
    }

    // If neither CatOffer nor PrOffer exists, use the regular price
    if (!productData.CatOffer && !productData.PrOffer) {
      priceToAdd = productData.price;

      // Set the original price as Tprice and totalPrice
      userCart.Tprice = priceToAdd;
      userCart.totalPrice = priceToAdd;
    }

    if (existingProductIndex !== -1) {
      // If the product already exists in the cart, increase the quantity
      userCart.items[existingProductIndex].quantity += 1;
      // Update the total price by adding the price of the product being added
      userCart.totalPrice = userCart.items.reduce((total, item) => total + item.quantity * item.price, 0);;
      // Update Tprice based on all items in the cart
      userCart.Tprice = userCart.items.reduce((total, item) => total + item.quantity * item.price, 0);;
    } else {
      // If the product is not in the cart, add it as a new item
      userCart.items.push({
        product_id: productId,
        quantity: 1,
        price: priceToAdd,
      });
      // Update the total price with the price of the newly added product
      // userCart.totalPrice = priceToAdd;
      userCart.totalPrice = userCart.items.reduce((total, item) => total + item.quantity * item.price, 0);;
      // Update Tprice based on all items in the cart
      // userCart.Tprice = priceToAdd;
      userCart.Tprice = userCart.items.reduce((total, item) => total + item.quantity * item.price, 0);;
    }

    await userCart.save();

    console.log('Product added to the cart successfully.');
    res.redirect('/cart/load-cart');
  } catch (error) {
    console.log("error from addProduct", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};







// const updateCart = async (req, res) => {
//   try {
//     const { productId, adjustment } = req.body;
//     console.log('Received update request:', productId, adjustment);

//     // Find the user's cart
//     const currentUser = req.session.user;

//     let userCart = await Cart.findOne({ user_id: currentUser._id });
//     const prod = await Product.findOne({ _id: productId });
//     const totalstock = prod.countStock;
//     // console.log("Product Stock:", totalstock);

//     // If the cart doesn't exist, create a new one and initialize the total price
//     if (!userCart) {
//       userCart = new cartModel({
//         user_id: currentUser._id,
//         items: [],
//         totalPrice: 0,
//         Tprice:0
//       });

//       // Save the new cart
//       await userCart.save();
//     }

//     // Find the item in the cart with the given productId
//     const itemIndex = userCart.items.findIndex(item => String(item.product_id) === productId);
//     // console.log("itemIndex:", itemIndex);

//     if (itemIndex !== -1) {
//       // Get the original quantity and price of the item
//       const originalQuantity = userCart.items[itemIndex].quantity;
//       const pricePerUnit = userCart.items[itemIndex].price;

//       // Calculate the new quantity after adjustment
//       let newQuantity = userCart.items[itemIndex].quantity + parseInt(adjustment, 10);

//       // Ensure the new quantity does not exceed the total stock
//       newQuantity = Math.min(newQuantity, totalstock);

//       // Ensure the new quantity is at least 1
//       newQuantity = Math.max(newQuantity, 1);
//       console.log("new qya",newQuantity)

//       console.log("total stock",totalstock)
//       // Calculate the change in quantity
//       const quantityChange = newQuantity - originalQuantity;

//       // Update the quantity
//       userCart.items[itemIndex].quantity = newQuantity;

//       // Update the total price in the cart
//       userCart.totalPrice += quantityChange * pricePerUnit;
//       userCart.Tprice += quantityChange * pricePerUnit;

//       // Save the updated cart
//       const updatedCart = await userCart.save();

//       // Calculate the total amount for the updated cart
//       const totalAmount = userCart.items.reduce((total, item) => total + item.quantity * item.price, 0);

//       // Send the updated cart and total amount back to the client
//       res.status(200).json({ userCart: updatedCart, totalAmount,totalstock,newQuantity, message: 'Quantity updated successfully.' });
//     } else {
//       res.status(404).json({ error: 'Product not found in the cart.' });
//     }
//   } catch (error) {
//     console.log("error from updateCart", error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };


const updateCart = async (req, res) => {
  try {
    const { productId, adjustment } = req.body;
    console.log('Received update request:', productId, adjustment);

    // Find the user's cart
    const currentUser = req.session.user;
    let userCart = await Cart.findOne({ user_id: currentUser._id });
    const prod = await Product.findOne({ _id: productId });
    const totalstock = prod.countStock;

    // If the cart doesn't exist, create a new one and initialize the total price
    if (!userCart) {
      userCart = new cartModel({
        user_id: currentUser._id,
        items: [],
        totalPrice: 0,
        Tprice: 0
      });
      // Save the new cart
      await userCart.save();
    }

    // Find the item in the cart with the given productId
    const itemIndex = userCart.items.findIndex(item => String(item.product_id) === productId);

    if (itemIndex !== -1) {
      // Get the original quantity and price of the item
      const originalQuantity = userCart.items[itemIndex].quantity;

      // Fetch the latest price of the product from the database
      let pricePerUnit = prod.price; // Consider default product price if not found
      if (prod.CatOffer && prod.PrOffer) {
        const catOfferPrice = prod.CatOffer.catOfferPrice;
        const prodOfferPrice = prod.PrOffer.prodOfferPrice;
        pricePerUnit = Math.min(catOfferPrice, prodOfferPrice);
      } else if (prod.CatOffer) {
        pricePerUnit = prod.CatOffer.catOfferPrice;
      } else if (prod.PrOffer) {
        pricePerUnit = prod.PrOffer.prodOfferPrice;
      }

      // Calculate the new quantity after adjustment
      let newQuantity = userCart.items[itemIndex].quantity + parseInt(adjustment, 10);
      // Ensure the new quantity does not exceed the total stock
      newQuantity = Math.min(newQuantity, totalstock);
      // Ensure the new quantity is at least 1
      newQuantity = Math.max(newQuantity, 1);

      // Calculate the change in quantity
      const quantityChange = newQuantity - originalQuantity;

      // Update the quantity
      userCart.items[itemIndex].quantity = newQuantity;

      // Update the price of the item in the cart based on the latest price from the database
      userCart.items[itemIndex].price = pricePerUnit;

      // Update the total price in the cart
      const totalAmount = userCart.items.reduce((total, item) => total + item.quantity * item.price, 0);
      userCart.totalPrice = totalAmount;
      userCart.Tprice = totalAmount;

      // Save the updated cart
      const updatedCart = await userCart.save();

      // Send the updated cart and total amount back to the client
      res.status(200).json({ userCart: updatedCart, totalAmount, totalstock, newQuantity, message: 'Quantity updated successfully.' });
    } else {
      res.status(404).json({ error: 'Product not found in the cart.' });
    }
  } catch (error) {
    console.log("error from updateCart", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};





const removeProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const currentUser = req.session.user;

    // Assuming your Cart model has a field 'user_id' for the user reference
    const userCart = await Cart.findOne({ user_id: currentUser._id });

    // Use filter to create a new array without the item to be removed
    userCart.items = userCart.items.filter(item => String(item.product_id) !== productId);

    // Save the updated cart
    // userCart.totalPrice = 0;
    // userCart.Tprice=0;

    await userCart.save();

    // Calculate the total amount
    const totalAmount = userCart.items.reduce((total, item) => total + item.quantity * item.price, 0);

    // Redirect to the cart page
    return res.redirect('/cart/load-cart');
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).send('Internal Server Error');
  }
};









module.exports={
    loadCart,
    addToCart,
    updateCart,
    removeProduct,
   


  }
