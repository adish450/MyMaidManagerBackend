const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { 
    getAllMaids,
    addMaid,
    getMaidById,
    addTaskToMaid,
    deleteTaskFromMaid,
    calculatePayroll, // Import the new function
    requestAttendanceOtp,
    verifyOtpAndMarkAttendance
} = require('../controllers/maidController');

// All routes here are protected by the auth middleware

router.get('/', auth, getAllMaids);
router.post('/', auth, addMaid);

router.get('/:maidId', auth, getMaidById);

// New route for payroll calculation
router.get('/:maidId/payroll', auth, calculatePayroll);

router.post('/:maidId/tasks', auth, addTaskToMaid);
router.delete('/:maidId/tasks/:taskId', auth, deleteTaskFromMaid);

router.post('/request-otp/:maidId', auth, requestAttendanceOtp);
router.post('/verify-otp/:maidId', auth, verifyOtpAndMarkAttendance);

module.exports = router;