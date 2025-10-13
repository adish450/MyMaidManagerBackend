const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { 
    getAllMaids, 
    addMaid,
    requestAttendanceOtp,
    verifyOtpAndMarkAttendance
} = require('../controllers/maidController');

// All routes here are protected by the auth middleware

// Get all maids for a user
router.get('/', auth, getAllMaids);

// Add a new maid
router.post('/', auth, addMaid);

// Request an OTP for attendance
router.post('/request-otp/:maidId', auth, requestAttendanceOtp);

// Verify OTP and mark attendance
router.post('/verify-otp/:maidId', auth, verifyOtpAndMarkAttendance);


module.exports = router;