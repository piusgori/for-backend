const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const everyone = new Schema({
    email: {type: String, required: true},
    userId: {type: Schema.Types.ObjectId, ref: 'User'},
    adminId: {type: Schema.Types.ObjectId, ref: 'Admin'}
})

module.exports = mongoose.model('Everyone', everyone);