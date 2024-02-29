const isLogin = async (req, res, next) => {
    try {
      if (req.session.admin) {
        next();
      } else {
        res.redirect('/admin/adminLogin');
      }
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };
  
  const isLogout = async (req, res, next) => {
    try {
      if (req.session.admin) {
        res.redirect('/admin/adhome');
      } else {
        next(); // Continue to the next middleware or route handler
      }
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };
  