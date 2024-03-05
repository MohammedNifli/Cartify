// Middleware to check if user is logged in
const isLogin = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            next(); 
        } else {
            res.redirect('/login'); 
        }
    } catch (error) {
        console.error('Error in isLogin middleware:', error);
        res.status(500).send('Internal Server Error');
    }
};

// Middleware to check if user is logged out
const isLogout = async (req, res, next) => {
    try {
        if (!req.session.user_id) {
            next();  
        } else {
            res.redirect('/ecom');
            
        }
    } catch (error) {
        console.error('Error in isLogout middleware:', error);
        res.status(500).send('Internal Server Error');
    }
};





module.exports={
    isLogin,
    isLogout
}