// checkBlock.js
const User = require('../models/userModel'); // Make sure to import your User model

const checkBlocked = async (req, res, next) => {
    try {
        // Check if there is an active session and user ID in the session
        if (req.session && req.session.user_id) {
            // Find the user by ID
            const user = await User.findById(req.session.user_id);

            if (!user) {
                // User not found, log out and redirect to login
                console.log(`User with ID ${req.session.user_id} not found. Logging out.`);
                req.session.destroy();
                return res.status(403).redirect('/login'); // Set 403 Forbidden status
            }

            // Check if the user is blocked
            if (user.isBlocked) {
                console.log(`User ${user.username} is blocked. Logging out.`);
                req.session.destroy();
                return res.status(403).redirect('/login'); // Set 403 Forbidden status
            }

            // If not blocked, continue to the next middleware or route handler
            return next();
        } else {
            // No active session or user ID, log out and redirect to login
            console.log("No active session or user_id. Logging out.");
            req.session.destroy();
            return res.status(403).redirect('/login'); // Set 403 Forbidden status
        }
    } catch (error) {
        console.error('Error in checkBlocked middleware:', error);
        return res.status(500).send('Internal server error');
    }
};

module.exports = checkBlocked;









// const blockCheckMiddleware = async (req, res, next) => {
//     try {
//         const userId = req.session.user_id; // A

//         if (userId) {
//             const user = await User.findById(userId);

//             if (user && user.isBlocked) {
//                 req.session.destroy(); // Destroy the session
//                 return res.status(403).redirect('/login');
//             }
//         }

//         // If the user is not blocked or if there's no user ID in the session, proceed to the next middleware or route handler
//         next();
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Internal server error');
//     }
// };

// module.exports = blockCheckMiddleware;
