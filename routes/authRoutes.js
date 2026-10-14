const router = require('express').Router();
const authController = require('../controllers/authController');
const { redirectIfAuth } = require('../middlewares/auth');

router.get('/login', redirectIfAuth, authController.loginForm);
router.post('/login', redirectIfAuth, authController.login);

router.get('/signup', redirectIfAuth, authController.signupForm);
router.post('/signup', redirectIfAuth, authController.signup);

router.get('/logout', authController.logout);

module.exports = router;
