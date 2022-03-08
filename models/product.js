const mongoose = require('mongoose');
const Schema  = mongoose.Schema;
const product = new Schema({
    title: {type: String, required: true},
    imageUrl: {type: String, required: true},
    description: {type: String, required: true},
    price: {type: Number, required: true},
    category: {type: String, required: true},
    adminId: {type: Schema.Types.ObjectId, required: true},
    discount: {type: Boolean, required: true},
    discountPrice: {type: Number},
}, {timestamps: true})

product.methods.editProduct = function(title, category, price, description, discount, discountPrice, imageUrl){
    this.title = title;
    this.category = category;
    this.price = price;
    this.description = description;
    this.discount = discount;
    this.discountPrice = discountPrice;
    if(imageUrl !== undefined){
        this.imageUrl = imageUrl;
    }
    return this.save();
}

module.exports = mongoose.model('Product', product);