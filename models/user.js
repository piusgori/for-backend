const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const user = new Schema({
    name: {type: String, required: true},
    email: {type: String, required: true},
    username: {type: String, required: true},
    password: {type: String, required: true},
    resetCode: {type: Number, expires: 3600, default: Date.now},
    token: {type: String, expires: 3600, default: Date.now},
    cart: {type: Array}
})

user.methods.changePassword = function(newPassword){
    this.password = newPassword;
    return this.save();
}

user.methods.deleteCart = function(emptyCart){
    this.cart = emptyCart;
    return this.save();
}

module.exports = mongoose.model('User', user);