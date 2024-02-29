// Define a middleware function to handle errors
const errorHandler = (err, req, res, next) => {
    console.error(err.stack); // Log the error

    // Render the error page
    res.status(500).render('err500', {
        message: 'Internal Server Error',
        error: err
    });
};

module.exports = errorHandler;
