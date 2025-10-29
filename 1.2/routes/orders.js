// routes/orders.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/', orderController.createOrder); // transactional
router.get('/:id', orderController.getOrder);

module.exports = router;
