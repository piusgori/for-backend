const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const admin = new Schema({
    name: {type: String, required: true},
    email: {type: String, required: true},
    username: {type: String, required: true},
    password: {type: String, required: true},
    service: {type: String, required: true},
    genre: {type: String, required: true},
    phone: {type: String, required: true},
    resetCode: {type: Number, expires: 3600, default: Date.now},
    token: {type: String, expires: 3600, default: Date.now},
    cart: {type: Array}
})

admin.methods.changePassword = function(newPassword){
    this.password = newPassword;
    return this.save();
}

admin.methods.deleteCart = function(emptyCart){
    this.cart = emptyCart;
    return this.save();
}


module.exports = mongoose.model('Admin', admin);