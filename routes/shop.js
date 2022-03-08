const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const shopController = require('../controllers/shop');

router.post('/send-mail', shopController.sendEmail);

router.get('/home-products',shopController.getProducts);

router.post('/add-product', [
    body('price').isNumeric().withMessage('The price should be a number!'),
    body('description').isLength({min: 10}).withMessage('Your description should be at least 10 characters long!')
], shopController.addProduct);

router.post('/filter-products', shopController.filterProducts);

router.post('/product', shopController.oneProduct);

router.post('/cart', shopController.cart);

router.post('/update-cart', shopController.updateCart);

router.post('/account', shopController.account);

router.post('/edit-product', shopController.editProduct);

router.post('/delete-product', shopController.deleteProduct);

router.post('/search-anything', shopController.searchAnything);

router.post('/search-result', shopController.oneItemResult);

router.post('/person-result', shopController.foundPerson);

router.post('/checkout', shopController.completeCheckout);

router.post('/delete-cart', shopController.deleteCart);

module.exports = router;