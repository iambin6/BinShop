const router = require('express').Router();
const c = require('../controllers/orderController');
const { requireAuth } = require('../middlewares/auth');

// All order actions require user to be authenticated
router.use(requireAuth);

router.get('/', c.list);
router.get('/create', c.createForm);
router.post('/create', c.create);
router.get('/update/:id', c.updateForm);
router.post('/update/:id', c.update);
router.post('/delete/:id', c.remove);

module.exports = router;