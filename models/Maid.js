const mongoose = require('mongoose');

const MaidSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    tasks: [{
        _id: mongoose.Schema.Types.ObjectId,
        name: String,
        price: Number,
        frequency: String
    }],
    attendance: [{
        date: Date,
        taskName: String,
        status: String
    }]
});

module.exports = mongoose.model('Maid', MaidSchema);