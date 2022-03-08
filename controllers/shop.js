require('dotenv');
const nodemailer = require('nodemailer');
const sendgrid = require('nodemailer-sendgrid-transport');
const Admin = require('../models/admin');
const User = require('../models/user');
const Product = require('../models/product');
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator'); 

const transporter = nodemailer.createTransport(sendgrid({auth: {api_key: process.env.SENDGRID}}));

exports.sendEmail = (req, res, next) => {
    const email = req.body.email;
    Product.find().then(foundProduct => {
        const products = [];
        let message = "<p>Our new products are...</p>";
        foundProduct.reverse();
        if(foundProduct.length <= 10){
            for(let i = 0; i < foundProduct.length; i++){
                products.push(foundProduct[i]);
            }
        } else if(foundProduct.length > 10){
            for(let j = 0; j < 10; j++){
                products.push(foundProduct[j]);
            }
        }
        if(foundProduct.length === 0){
             message = '<p>We have not yet added products to our shop.</p>';
        }
        else if (foundProduct.length > 0){
            for(let k = 0; k < products.length; k++){
                message += `<p>${products[k].title}: KSH ${products[k].price}</p>`;
            }
        }
        const sentMessage = message;
        return sentMessage;
    }).then(receivedMessage => {
        if(!receivedMessage){
            const error = new Error('We are sorry for any incovenience while sending you an email!');
            error.statusCode = 500;
            error.errorMessage = 'We are sorry for any incovenience while sending you an email!';
            throw error;
        }
        transporter.sendMail({
            to: email,
            from: 'dreefstar@gmail.com',
            subject: 'New Products from your favourite sellers!',
            html: `<h1>Are you ready for new products?</h1>
            <p>Well...Hello! We are ready to offer you the best of the best products from our sellers.</p>
            ${receivedMessage}
            <h2>We are glad to have you on board</h2>
            `
        });
        res.json({message: 'E-Mail sent successfully. Please chech your inbox!'});
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}


exports.addProduct = (req, res, next) => {
    const title = req.body.title;
    const category = req.body.category;
    const price = Number(req.body.price);
    const description = req.body.description;
    const path = req.file.path;
    const imageUrl = path.split('photographyImageSection')[1].substring(2, path.split('photographyImageSection')[1].length);
    const token = req.body.token;
    const errors = validationResult(req);
    if(!req.file){
        const error = new Error("A file wasn't uploaded to the server");
        error.statusCode = 422;
        error.errorMessage = "A file wasn't uploaded to the server";
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
            const error = new Error('An admin was not found!');
            error.statusCode = 422;
            error.errorMessage = 'An admin was not found!';
            throw error;
        }
        const product = new Product({title: title, category: category, price: price, description: description, imageUrl: imageUrl, discount: false, adminId: foundAdmin._id});
        product.save();
        res.json({message: 'Product added successfully'});
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}

exports.getProducts = (req, res, next) => {
    Product.find().then(product => {
        if(!product){
            const error = new Error('Could not find products! Sorry for the misconvenience!');
            error.statusCode = 500;
            error.errorMessage = 'Could not find products! Sorry for the misconvenience!';
            throw error;
        }
        product.reverse();
        res.json({message: 'Sent products successfully to the clients', product: product});
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err)
    })
}

exports.filterProducts = (req, res, next) => {
    const category = req.body.category;
    const sort = req.body.sort;
    Product.find({category: category}).then(products => {
        if(!products){
            const error = new Error('Could not find a product! We are sorry for the inconvenience');
            error.statusCode = 500;
            error.errorMessage = 'Could not find a product! We are sorry for the inconvenience';
            throw error;
        }
        if(sort === "Price" && products.length !== 0){
            products.sort((a, b) => {
                if(a.price > b.price){
                    return -1;
                } if(a.price < b.price){
                    return 1;
                }
                return 0;
            })
        }
        if(sort === 'Date Added' && products.length !== 0){
            products.sort((a, b) => {
                if((new Date(a.createdAt)).getTime() > (new Date(b.createdAt)).getTime()){
                    return -1;
                } if((new Date(a.createdAt)).getTime() < (new Date(b.createdAt)).getTime()){
                    return 1;
                }
                return 0;
            })
        }
        res.json({message: 'Sent the products to client', product: products});
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}

exports.oneProduct = (req, res, next) => {
    const id = req.body.id;
    Product.findById(id).then(foundProduct => {
        if(!foundProduct){
            const error = new Error('The Product you wanted to view was not found!');
            error.statusCode = 500;
            error.errorMessage = 'The Product you wanted to view was not found!';
            throw Error;
        }
        res.json({message: 'Send product details to client', product: foundProduct});
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}

exports.cart = (req, res, next) => {
    const token = req.body.token;
    Admin.findOne({token: token}).then(foundAdmin => {
        if(!foundAdmin){
            return User.findOne({token: token}).then(foundUser => {
                if(!foundUser){
                    const error = new Error('No User Or Admin Found');
                    error.statusCode = 500;
                    error.errormMessage = 'No User Or Admin Found';
                    throw error;
                }
                res.json({message: 'Found User', items: foundUser.cart});
            }).catch(err => {
                if(!err.statusCode){
                    err.statusCode = 500;
                }
                next(err);
            })
        }
        res.json({message: 'Found Admin', items: foundAdmin.cart});
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}

exports.updateCart = (req, res, next) => {
    const token = req.body.token;
    const cart = req.body.cart;
    Admin.findOneAndUpdate({token: token}, {cart: cart}).then(foundAdmin => {
        if(!foundAdmin){
            return User.findOneAndUpdate({token: token}, {cart: cart}).then(foundUser => {
                if(!foundUser){
                    const error = new Error('No User Or Admin Found');
                    error.statusCode = 500;
                    error.errorMessage = 'No User Or Admin Found';
                    throw error;
                }
                res.json({message: 'Found User And updated cart'})
            }).catch(err => {
                if(!err.statusCode){
                    err.statusCode = 500;
                }
                next(err);
            })
        }
        res.json({message: 'Found Admin and updated the cart'})
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}

exports.account = (req, res, next) => {
    const token = req.body.token;
    Admin.findOne({token: token}).then(foundAdmin => {
        if(!foundAdmin){
            return User.findOne({token: token}).then(foundUser => {
                if(!foundUser){
                    const error = new Error('An Admin or User who holds that account was not found');
                    error.statusCode = 500;
                    error.errorMessage = 'An Admin or User who holds that account was not found';
                    throw error;
                }
                res.json({message: 'Found the User', person: 'user', account: foundUser});
            }).catch(err => {
                if(!err.statusCode){
                    err.statusCode = 500;
                }
                next(err);
            })
        }
        Product.find({adminId: foundAdmin._id}).then(foundProducts => {
            if(!foundProducts){
                const error = new Error('You have not yet added any products yet');
                error.statusCode = 422;
                error.errorMessage = 'You have not yet added any products yet';
                throw error;
            }
            res.json({message: 'Found the Admin', person: 'admin', account: foundAdmin, products: foundProducts})
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

exports.editProduct = (req, res, next) => {
    const id = req.body.id;
    const title = req.body.title;
    const category =req.body.category;
    const price = req.body.price;
    const description = req.body.description;
    const file = req.file;
    const isDiscount = req.body.discount;
    const isDiscountPrice = req.body.discountPrice;
    Product.findOne({_id: id}).then(foundProduct => {
        if(!foundProduct){
            const error = new Error('The Product was not found!');
            error.statusCode = 500;
            error.errorMessage = 'The Product was not found!';
            throw error;
        }
        if(file){
            const filePath = path.join(__dirname, '../', 'public', 'photographyImageSections', foundProduct.imageUrl);
            fs.unlink(filePath, (erro) => {
                if(erro){
                    const error = new Error('Unable to delete the image!');
                    error.statusCode = 500;
                    error.errorMessage = 'Unable to delete the product!';
                    throw error;
                }
            })
        }
        const discount = isDiscount === 'Yes' ? true : false;
        const discountPrice = isDiscount === 'Yes' ? isDiscountPrice : null;
        const imageUrl = file ? file.path.split('photographyImageSection')[1].substring(2, file.path.split('photographyImageSection')[1].length) : undefined;
        foundProduct.editProduct(title, category, price, description, discount, discountPrice, imageUrl);
        res.json({message: 'Product edited successfully!'});
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}

exports.deleteProduct = (req, res, next) => {
    const id = req.body.id;
    Product.findById(id).then(foundProduct => {
        if(!foundProduct){
            const error = new Error('Unable to find the product to delete');
            error.statusCode = 500;
            error.errorMessage = 'Unable to find the product to delete';
            throw error;
        }
        const fileName = foundProduct.imageUrl;
        const filePath = path.join(__dirname, '../', 'public', 'photographyImageSections', fileName);
        fs.unlink(filePath, (erro) => {
            if(erro){
                const error = new Error('Unable to delete the product!');
                error.statusCode = 500;
                error.errorMessage = 'Unable to delete the product!';
                throw error;
            }
        });
        Product.deleteOne({_id: id}).then(result => {
            res.json({message: 'Your Product Has Been Deleted Successfully!'})
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

exports.searchAnything = (req, res, next) => {
    const data = req.body.data;
    Product.find().then(foundProducts => {
        if(!foundProducts){
            const error = new Error('We are sorry that there is a server side error!');
            error.statusCode = 500;
            error.errorMessage = 'We are sorry that there is a server side error!';
            throw error;
        }
        Admin.find().then(foundAdmins => {
            if(!foundAdmins){
                const error = new Error('We are sorry that we could not find people for you!');
                error.statusCode = 500;
                error.errorMessage = 'We are sorry that we could not find people for you!';
                throw error;
            }
            const products = foundProducts.map(product => {
                return product.title;
            })
            const categories = foundProducts.map(product => {
                return product.category;
            })
            for(let i = 0; i < categories.length; i++){
                for(let j = 0; j < categories.length; j++){
                    if(i !== j){
                        if(categories[i] === categories[j]){
                            categories.splice(j, 1);
                        }
                    }
                }
            }
            const people = foundAdmins.map(person => {
                return person.name;
            })
            const allItems = [...products, ...categories, ...people];
            const matchProducts = products.filter(item => {
                return item.toLowerCase().includes(data.toLowerCase());
            })
            const matchCategories = categories.filter(item => {
                return item.toLowerCase().includes(data.toLowerCase());
            })
            const matchPeople = people.filter(item => {
                return item.toLowerCase().includes(data.toLowerCase());
            })
            const matchResults = allItems.filter(item => {
                return item.toLowerCase().includes(data.toLowerCase());
            })
            res.json({message: 'Items sent to the client successfully!', result: matchResults, allThings: [matchProducts, matchCategories, matchPeople], foundPeople: foundAdmins, foundProducts});
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

exports.oneItemResult = (req, res, next) => {
    const input = req.body.input;
    Admin.find({name: input}).then(foundAdmin => {
        if(foundAdmin.length === 0){
            return Product.find({title: input}).then(foundProduct => {
                if(foundProduct.length === 0){
                    return Product.find({category: input}).then(foundCategory => {
                        if(foundCategory.length === 0){
                            const error = new Error('No item found that matches your request!');
                            error.statusCode = 500;
                            error.errorMessage = 'No item found that matches your request!';
                            throw error;
                        }
                        return foundCategory[0].category.trim().toLowerCase();
                    }).then(editedCategory => {
                        let newEditedCategory = editedCategory;
                        if(editedCategory.includes(' ')){
                            newEditedCategory = editedCategory.replace(/\s+/g, '-').toLowerCase();
                        }
                        return newEditedCategory;
                    }).then(categoryToBeSent => {
                        res.json({message: 'Category found', category: categoryToBeSent});
                    }).catch(err => {
                        if(!err.statusCode){
                            err.statusCode = 500;
                        }
                        next(err);
                    })
                }
                res.json({message: 'Found the product', product: foundProduct[0]._id})
            }).catch(err => {
                if(!err.statusCode){
                    err.statusCode = 500;
                }
                next(err);
            })
        }
        res.json({message: 'Found the person', person: foundAdmin[0]._id});
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}

exports.foundPerson = (req, res, next) => {
    const id = req.body.id;
    Admin.findById(id).then(foundAdmin => {
        if(!foundAdmin){
            const error = new Error('We are sorry for this inconvenience!');
            error.statusCode = 500;
            error.errorMessage = 'We are sorry for this inconvenience!';
            throw error;
        }
        Product.find({adminId: id}).then(foundProducts => {
            if(!foundProducts){
                const error =  new Error('We are sorry for this inconvenience!');
                error.statusCode = 500;
                error.errorMessage = 'We are sorry for this inconvenience!';
                throw error;
            }
            res.json({message: 'Found the person you were looking for', person: foundAdmin, products: foundProducts});
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

exports.completeCheckout = (req, res, next) => {
    const checkout = req.body.checkout;
    const soldProducts = [];
    Product.find().then(foundProducts => {
        const adminOwner = [];
        for(let a = 0; a < foundProducts.length; a++){
            for(let b = 0; b < checkout.length; b++){
                if(foundProducts[a].title === checkout[b].title){
                    soldProducts.push(foundProducts[a]);
                    adminOwner.push(foundProducts[a].adminId.toString());
                }
            }
        }
        const theOwners = adminOwner;
        return theOwners;
    }).then(owner => {
        for(let c = 0; c < owner.length; c++){
            for(let d = (c + 1); d < owner.length; d++){
                if(c !== d){
                    if(owner[c] === owner[d]){
                        owner.splice(d, 1);
                    }
                }
            }
        }
        const filteredOwners = owner;
        return filteredOwners;
    }).then(ownerFilter => {
        Admin.find().then(foundAdmins => {
            const loopProducts = soldProducts;
            const messages = [];
            for(let z = 0; z < ownerFilter.length; z++){
                const thePerson = foundAdmins.filter(each => {
                    return each._id.toString() === ownerFilter[z];
                })
                const phoneNumber = thePerson[0].phone;
                let content = "Hello! I would like to buy the following Products...";
                for(let y = 0; y < loopProducts.length; y++){
                    if(ownerFilter[z] === loopProducts[y].adminId.toString()){
                        content += `${loopProducts[y].title}, `;
                    }
                }
                messages.push({phone: phoneNumber,content: content});
            }
            res.json({message: 'Products received', ownerFilter, messages});
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

exports.deleteCart = (req, res, next) => {
    const token = req.body.token;
    Admin.findOne({token: token}).then(deletedAdminCart => {
        if(!deletedAdminCart){
            return User.findOne({token: token}).then(deletedUserCart => {
                if(!deletedUserCart){
                    const error = new Error('Failed to delete your cart! Sorry for the inconvenience!');
                    error.statusCode = 500;
                    error.errorMessage = 'Failed to delete your cart! Sorry for the inconvenience!';
                    throw error;
                }
                deletedUserCart.deleteCart([]);
                res.json({message: 'Deleted Cart successfully'});
            }).catch(err => {
                if(!err.statusCode){
                    err.statusCode = 500;
                }
                next(err);
            })
        }
        deletedAdminCart.deleteCart([]);
        res.json({message: 'Deleted Cart Successfully'});
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}
