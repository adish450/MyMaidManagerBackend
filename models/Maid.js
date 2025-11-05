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
    }],
    notes: [{
        date: Date, // The date the note is for
        text: String, // The content of the note
        createdAt: { type: Date, default: Date.now } // When the note was added
    }]
});

module.exports = mongoose.model('Maid', MaidSchema);