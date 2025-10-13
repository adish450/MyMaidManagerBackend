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
    // New fields for OTP-based attendance
    otp: {
        type: String,
    },
    otpExpires: {
        type: Date,
    },
    // Future fields for tasks and attendance records
    tasks: [{
        name: String,
        price: Number,
        frequency: String
    }],
    attendance: [{
        date: Date,
        taskName: String,
        status: String // e.g., 'Present', 'Absent'
    }]
});

module.exports = mongoose.model('Maid', MaidSchema);