require('dotenv');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Admin = require('../models/admin');
const nodemailer = require('nodemailer');
const sendgrid = require('nodemailer-sendgrid-transport');
const Everyone = require('../models/everyone');

const transporter = nodemailer.createTransport(sendgrid({auth: {api_key: process.env.SENDGRID}}));

exports.userLogin = (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;
    let message;
    let userBeingChecked;
    User.findOne({username: username}).then(foundUser => {
        userBeingChecked = foundUser;
        if(!userBeingChecked){
            const error = new Error('No User found with the username!');
            error.statusCode = 422;
            error.errorMessage = 'No User found with the username!';
            throw error;
        } else {
            bcrypt.compare(password, userBeingChecked.password).then(passwordMatch => {
                if(!passwordMatch){
                    const error = new Error('You have entered the wrong password!');
                    error.statusCode = 422;
                    error.errorMessage = 'You have entered the wrong password!';
                    throw error;
                } else{
                    const token  = jwt.sign({userId: userBeingChecked._id.toString() ,email: userBeingChecked.email, username: userBeingChecked.username}, 'thegreatestsecretofalltimethatnoonecaneverknow', {expiresIn: '1h'});
                    User.findOneAndUpdate({username: username}, {token: token}).then(foundUser => {
                        message = {message: 'Login Successfull', token: token};
                        res.json(message);
                    }).catch(err => {
                        if(!err.statusCode){
                            err.statusCode = 500;
                        }
                        next(err)
                    })
                }
            }).catch(err => {
                if(!err.statusCode){
                    err.statusCode = 500;
                }
                next(err);
            })
        }
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}

exports.adminLogin = (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;
    let message;
    let userBeingChecked;
    Admin.findOne({username: username}).then(foundUser => {
        userBeingChecked = foundUser;
        if(!userBeingChecked){
            const error = new Error('No Admin found with the username!');
            error.statusCode = 422;
            error.errorMessage = 'No Admin found with the username!';
            throw error;
        } else {
            bcrypt.compare(password, userBeingChecked.password).then(passwordMatch => {
                if(!passwordMatch){
                    const error = new Error('You have entered the wrong password!');
                    error.statusCode = 422;
                    error.errorMessage = 'You have entered the wrong password!';
                    throw error;
                } else{
                    const token  = jwt.sign({userId: userBeingChecked._id.toString() ,email: userBeingChecked.email, username: userBeingChecked.username}, 'thegreatestsecretofalltimethatnoonecaneverknow', {expiresIn: '1h'});
                    Admin.findOneAndUpdate({username: username}, {token: token}).then(foundAdmin => {
                        message = {message: 'Login Successfull', token: token};
                        res.json(message);
                    }).catch(err => {
                        if(!err.statusCode){
                            err.statusCode = 500;
                        }
                        next(err)
                    })
                }
            }).catch(err => {
                if(!err.statusCode){
                    err.statusCode = 500;
                }
                next(err);
            })
        }
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}


exports.userSignup = (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const username = req.body.username;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);
    let message;
    if(!errors.isEmpty()){
        const error = new Error(errors.array()[0].msg);
        error.statusCode = 422;
        error.errorMessage = (errors.array()[0].msg);
        throw error;
    } else{
        bcrypt.hash(password, 12).then(hashedPassword => {
            const user = new User({name: name, email: email, username: username, password: hashedPassword});
            user.save();
            const everyone = new Everyone({email: email});
            everyone.save();
            transporter.sendMail({
                from: 'dreefstar@gmail.com',
                to: email,
                subject: 'Welcome To Our Community',
                html: `<h1>Hello ${name}</h1>
                <p>It is a great pleasure to have you on board!
                Welcome to our community. You can now interact with our sellers and you are now legible to get great discounts!</p>
                <h2>Thanks again.</h2>
                `
            })
        }).catch(err => {
            if(!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        })
        message = {message: 'all are valid'};
    }

    res.json(message)
}


exports.adminSignup = (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const username = req.body.username;
    const confirmPassword = req.body.confirmPassword;
    const genre = req.body.genre
    const service = req.body.service;
    const phone = req.body.phone;
    const errors = validationResult(req);
    let message;
    if(!errors.isEmpty()){
        const error = new Error(errors.array()[0].msg);
        error.statusCode = 422;
        error.errorMessage = (errors.array()[0].msg);
        throw error;
    }else{
        bcrypt.hash(password, 12).then(hashedPassword => {
            const updatedPhone = phone.toString().replace('0', '+254');
            const admin = new Admin({name: name, email: email, password: hashedPassword, username: username, service: service, phone: updatedPhone, genre: genre});
            admin.save();
            const everyone = new Everyone({email: email});
            everyone.save();
            transporter.sendMail({
                from: 'dreefstar@gmail.com',
                to: email,
                subject: 'Welcome To Our Community',
                html: `<h1>Hello ${name}</h1>
                <p>It is a great pleasure to have you on board!
                As a new seller we are greatly honored!
                welcome to our community where you can widen your market and definitely increase sales!</p>
                <h2>Thanks again.</h2>
                `
            })
        }).catch(err => {
            if(!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        })
        message = {messgae: 'all are valid'};
    }
    res.json(message);
}

exports.resetPassword = (req, res, next) => {
    const email = req.body.email;
    Everyone.findOne({email: email}).then(foundPerson => {
        if(!foundPerson){
            const error = new Error('There is no user or admin with such email!');
            error.statusCode = 422;
            error.errorMessage = 'There is no user or admin with such email!';
            throw error;
        }
        const randomNumberGenerated = Math.floor(Math.random() * 100000);
        Admin.findOneAndUpdate({email: email}, {resetCode: randomNumberGenerated}).then(updatedAdmin => {
            if(!updatedAdmin){
                User.findOneAndUpdate({email: email}, {resetCode: randomNumberGenerated}).then(updatedUser => {
                    if(!updatedUser){
                        const error = new Error('Internal error finding a user or admin');
                        error.statusCode = 500;
                        error.errorMessage = 'Internal error finding a user or admin';
                        throw error;
                    }
                    transporter.sendMail({
                        to: email,
                        from: 'dreefstar@gmail.com',
                        subject: 'Reset Code',
                        html: `<h1>Your Reset Code Has Arrived</h1>
                        <p>Please use this code ${randomNumberGenerated} to be able to reset your password.</p>
                        `
                    })
                    res.json({message: 'Email sent successfully'}); 
                }).catch(err => {
                    if(!err.statusCode){
                        err.statusCode = 500;
                    }
                    next(err);
                })
            }
            transporter.sendMail({
                to: email,
                from: 'dreefstar@gmail.com',
                subject: 'Reset Code',
                html: `<h1>Your Reset Code Has Arrived</h1>
                <p>Please use this code ${randomNumberGenerated} to be able to reset your password.</p>
                `
            })
            res.json({message: 'Email sent successfully'}); 
        }).catch(err => {
            if(!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        })
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}

exports.checkCode = (req, res, next) => {
    const email = req.body.email;
    const code = req.body.code;
    User.findOne({email: email}).then(foundUser => {
        if(!foundUser){
            Admin.findOne({email: email}).then(foundAdmin => {
                if(!foundAdmin){
                    const error = new Error('No User or Admin Found');
                    error.statusCode = 422;
                    error.errorMessage = 'No User or Admin Found';
                    throw error;
                }
                adminCodeValidity = foundAdmin.resetCode == code;
                if(!adminCodeValidity){
                    const error = new Error('You have entered the wrong reset code. Check your email and try again');
                    error.statusCode = 422;
                    error.errorMessage = 'You have entered the wrong reset code. Check your email and try again';
                    throw error;
                } else {
                    res.json({message: 'Code matched'});
                }
                
            }).catch(err => {
                if(!err.statusCode){
                    err.statusCode = 500;
                }
                next(err);
            })
        } else{
            codeValidity = foundUser.resetCode == code;
            if(!codeValidity){
                const error = new Error('You have entered the wrong reset code. Check your email and try again');
                error.statusCode = 422;
                error.errorMessage = 'You have entered the wrong reset code. Check your email and try again';
                throw error;
            } else {
                res.json({message: 'Code matched'});
            }
        }
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}

exports.setNewPassword = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error(errors.array()[0].msg);
        error.statusCode = 422;
        error.errorMessage = errors.array()[0].msg;
        throw error;
    }
    bcrypt.hash(password, 12).then(hashedPassword => {
        const newPassword = hashedPassword;
        Admin.findOneAndUpdate({email: email}, {password: newPassword}).then(updatedAdminPassword => {
            if(!updatedAdminPassword){
                return User.findOneAndUpdate({email: email}, {password: newPassword}).then(updatedUserPassword => {
                    if(!updatedUserPassword){
                        const error = new Error('A server side error occured. Please try again.');
                        error.statusCode = 500;
                        error.message = 'A server side error occured. Please try again.';
                        throw error;
                    }
                    res.json({message: 'Password Updated Successfully', password: newPassword});
                }).catch(err => {
                    if(!err.statusCode){
                        err.statusCode = 500;
                    }
                    next(err);
                })
            }
            res.json({message: 'Password Updated Successfully', password: newPassword});
        }).catch(err => {
            if(!err.statusCode){
                err.statusCode = 500;
            }
            next(err); 
        })
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    });
}

exports.changePassword = (req, res, next) => {
    const token = req.body.token;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);
    if(!token){
        const error = new Error('Account not logged in yet!');
        error.statusCode = 422;
        error.errorMessage = 'Account not logged in yet!';
        throw error;
    }
    if(!errors.isEmpty()){
        const error = new Error(errors.array()[0].msg);
        error.statusCode = 422;
        error.errorMessage = errors.array()[0].msg;
        throw error;
    }
    Admin.findOne({token: token}).then(foundAdmin => {
        if(!foundAdmin){
            return User.findOne({token: token}).then(foundUser => {
                if(!foundUser){
                    const error = new Error('No User or Admin found!');
                    error.statusCode = 500;
                    error.errorMessage = 'No User or Admin found!';
                    throw error;
                }
                bcrypt.compare(oldPassword, foundUser.password).then(matchedPassword => {
                    if(!matchedPassword){
                        const error = new Error('You have entered the wrong old password! Try again.');
                        error.statusCode = 422;
                        error.errorMessage = 'You have entered the wrong old password! Try again.';
                        throw error;
                    }
                    bcrypt.hash(newPassword, 12).then(hashedPassword => {
                        foundUser.changePassword(hashedPassword);
                        res.json({message: 'Your Password has been changed successfully!'});
                    }).catch(err => {
                        if(!err.statusCode){
                            err.statusCode = 500;
                        }
                        next(err);
                    })
                }).catch(err => {
                    if(!err.statusCode){
                        err.statusCode = 500;
                    }
                    next(err);
                })
            }).catch(err => {
                if(!err.statusCode){
                    err.statusCode = 500;
                }
                next(err);
            })
        }
        bcrypt.compare(oldPassword, foundAdmin.password).then(matchedAdminPassword => {
            if(!matchedAdminPassword){
                const error = new Error('You have entered the wrong old password! Try again.');
                error.statusCode = 422;
                error.errorMessage = 'You have entered the wrong old password! Try again.';
                throw error;
            }
            bcrypt.hash(newPassword, 12).then(hashedAdminPassword => {
                foundAdmin.changePassword(hashedAdminPassword);
                res.json({message: 'Your Password has been changed successfully!'});
            }).catch(err => {
                if(!err.statusCode){
                    err.statusCode = 500;
                }
                next(err);
            })
        }).catch(err => {
            if(!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        })
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}