const express = require('express');
const authControllers = require('../controllers/auth')
const {body} = require('express-validator');
const Everyone = require('../models/everyone');
const User = require('../models/user');

const router = express.Router();

router.post('/userSignup', [
    body('name').isLength({min: 5}).withMessage('Your name should be at least 5 characters long'),
    body('password').isLength({min: 8}).withMessage('Your password should be at least 8 characters long'),
    body('email').isEmail().withMessage('Please Enter a valid email').custom((value, {req}) => {
        return Everyone.findOne({email: req.body.email}).then(user => {
            if(user){
                return Promise.reject('There is already another user with a similar email')
            }
        })
    }),
    body('username').isLength({min: 5}).withMessage('Your username should be 5 characters long'),
    body('confirmPassword').custom((value, {req}) => {
        if(value !== req.body.password){
            throw new Error('Your passwords have to match')
        }
        return true;
    })
], authControllers.userSignup);


router.post('/adminSignup', [
    body('name').isLength({min: 5}).withMessage('Your name should be at least 5 characters long'),
    body('phone').isLength({min: 10, max: 11}).withMessage('Your phone number should be 10 digits!'),
    body('password').isLength({min: 8}).withMessage('Your password should be at least 8 characters long'),
    body('email').isEmail().withMessage('Please Enter a valid email').custom((value, {req}) => {
        return Everyone.findOne({email: req.body.email}).then(user => {
            if(user){
                return Promise.reject('There is already another user with a similar email')
            }
        })
    }),
    body('username').isLength({min: 5}).withMessage('Your username should be 5 characters long'),
    body('confirmPassword').custom((value, {req}) => {
        if(value !== req.body.password){
            throw new Error('Your passwords have to match')
        }
        return true;
    })
], authControllers.adminSignup)

router.post('/userLogin', authControllers.userLogin);

router.post('/adminLogin', authControllers.adminLogin);

router.post('/reset', authControllers.resetPassword);

router.post('/checkCode', authControllers.checkCode);

router.post('/setNewPassword', [
    body('password').isLength({min: 8}).withMessage('Your Password should be at least 8 characters long'),
    body('confirmPassword').custom((value, {req}) => {
        if(value !== req.body.password){
            throw new Error('Your passwords have to match');
        }
        return true;
    })
], authControllers.setNewPassword);

router.post('/change-password', [
    body('confirmPassword').custom((value, {req}) => {
        if(value !== req.body.newPassword){
            throw new Error('Your passwords have to match');
        }
        return true;
    })
], authControllers.changePassword)

module.exports = router;