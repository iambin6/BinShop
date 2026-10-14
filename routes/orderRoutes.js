const router = require('express').Router();
const c = require('../controllers/orderController');

router.get('/', c.list);
router.get('/create', c.createForm);
router.post('/create', c.create);
router.get('/update/:id', c.updateForm);
router.post('/update/:id', c.update);
router.post('/delete/:id', c.remove);

module.exports = router;