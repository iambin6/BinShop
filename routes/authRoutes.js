const router = require('express').Router();
const authController = require('../controllers/authController');
const { requireAuth, redirectIfAuth } = require('../middlewares/auth');

// Khách chưa đăng nhập
router.get('/login', redirectIfAuth, authController.loginForm);
router.post('/login', redirectIfAuth, authController.login);

router.get('/signup', redirectIfAuth, authController.signupForm);
router.post('/signup', redirectIfAuth, authController.signup);

router.get('/logout', authController.logout);

// Người dùng đã đăng nhập (Cài đặt & chỉnh sửa thông tin)
router.get('/profile', requireAuth, authController.profileForm);
router.post('/profile', requireAuth, authController.updateProfile);

module.exports = router;
