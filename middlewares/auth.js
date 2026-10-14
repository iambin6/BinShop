// Middleware checking if user is logged in
exports.requireAuth = (req, res, next) => {
  if (!req.session.user) {
    req.session.errorMessage = 'Vui lòng đăng nhập để truy cập trang này!';
    return res.redirect('/login');
  }
  next();
};

// Middleware redirecting logged-in user away from login/signup
exports.redirectIfAuth = (req, res, next) => {
  if (req.session.user) {
    return res.redirect('/orders');
  }
  next();
};
