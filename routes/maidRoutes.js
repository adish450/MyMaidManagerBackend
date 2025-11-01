const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { 
    getAllMaids,
    getMaidById,
    addMaid,
    updateMaid,
    deleteMaid,
    addTaskToMaid,
    updateTask,
    deleteTaskFromMaid,
    calculatePayroll,
    addManualAttendanceRecord,
    requestAttendanceOtp,
    verifyOtpAndMarkAttendance
} = require('../controllers/maidController');

// All routes here are protected by the auth middleware

router.get('/', auth, getAllMaids);
router.post('/', auth, addMaid);

router.get('/:maidId', auth, getMaidById);
router.get('/:maidId/payroll', auth, calculatePayroll);

router.put('/:maidId', auth, updateMaid);
router.delete('/:maidId', auth, deleteMaid);

router.post('/:maidId/tasks', auth, addTaskToMaid);
router.put('/:maidId/tasks/:taskId', auth, updateTask);
router.delete('/:maidId/tasks/:taskId', auth, deleteTaskFromMaid);

router.post('/:maidId/attendance/manual', auth, addManualAttendanceRecord);

router.post('/request-otp/:maidId', auth, requestAttendanceOtp);
router.post('/verify-otp/:maidId', auth, verifyOtpAndMarkAttendance);

module.exports = router;