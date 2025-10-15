const Maid = require('../models/Maid');
const otpGenerator = require('otp-generator');

// @route   GET api/maids
// @desc    Get all maids for the logged-in user
exports.getAllMaids = async (req, res) => {
    try {
        const maids = await Maid.find({ user: req.user.id }).sort({ name: 1 });
        res.json(maids);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   POST api/maids
// @desc    Add a new maid for the logged-in user
exports.addMaid = async (req, res) => {
    const { name, mobile, address } = req.body;
    if (!name || !mobile || !address) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }
    try {
        const newMaid = new Maid({ name, mobile, address, user: req.user.id });
        const maid = await newMaid.save();
        res.json(maid);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   POST api/maids/:maidId/tasks
// @desc    Add a task to a specific maid
exports.addTaskToMaid = async (req, res) => {
    const { name, price, frequency } = req.body;
    if (!name || !price || !frequency) {
        return res.status(400).json({ msg: 'Please provide name, price, and frequency for the task.' });
    }

    try {
        const maid = await Maid.findById(req.params.maidId);
        if (!maid) { return res.status(404).json({ msg: 'Maid not found' }); }
        if (maid.user.toString() !== req.user.id) { return res.status(401).json({ msg: 'User not authorized' }); }

        maid.tasks.unshift({ name, price, frequency });
        await maid.save();
        res.json(maid.tasks);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   DELETE api/maids/:maidId/tasks/:taskId
// @desc    Delete a task from a maid
exports.deleteTaskFromMaid = async (req, res) => {
    try {
        const maid = await Maid.findById(req.params.maidId);
        if (!maid) { return res.status(404).json({ msg: 'Maid not found' }); }
        if (maid.user.toString() !== req.user.id) { return res.status(401).json({ msg: 'User not authorized' }); }

        const removeIndex = maid.tasks.map(task => task.id).indexOf(req.params.taskId);
        if (removeIndex === -1) { return res.status(404).json({ msg: 'Task not found' }); }

        maid.tasks.splice(removeIndex, 1);
        await maid.save();
        res.json({ msg: 'Task removed' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   GET api/maids/:maidId/payroll
// @desc    Calculate payroll for a specific maid for the current month
exports.calculatePayroll = async (req, res) => {
    try {
        const maid = await Maid.findById(req.params.maidId);
        if (!maid) {
            return res.status(404).json({ msg: 'Maid not found' });
        }
        if (maid.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const startDate = new Date(Date.UTC(year, month, 1));
        const endDate = new Date(Date.UTC(year, month + 1, 1)); // End of month is start of next
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let totalSalary = 0;
        let totalDeductions = 0;
        const deductionsBreakdown = [];

        for (const task of maid.tasks) {
            totalSalary += task.price;

            let expectedWorkDays = 0;
            if (task.frequency.toLowerCase() === 'daily') {
                expectedWorkDays = daysInMonth;
            } else if (task.frequency.toLowerCase().includes('alternate')) {
                expectedWorkDays = Math.ceil(daysInMonth / 2);
            } else if (task.frequency.toLowerCase() === 'weekly') {
                expectedWorkDays = 4; // Approximation
            } else {
                expectedWorkDays = daysInMonth; // Default to daily
            }
            
            const costPerDay = expectedWorkDays > 0 ? task.price / expectedWorkDays : 0;

            const daysWorked = maid.attendance.filter(record => {
                const recordDate = new Date(record.date);
                return record.taskName === task.name &&
                       recordDate >= startDate &&
                       recordDate < endDate;
            }).length;

            const missedDays = expectedWorkDays - daysWorked;

            if (missedDays > 0) {
                const deduction = missedDays * costPerDay;
                totalDeductions += deduction;
                deductionsBreakdown.push({
                    taskName: task.name,
                    missedDays: missedDays,
                    deductionAmount: deduction,
                });
            }
        }

        const payableAmount = totalSalary - totalDeductions;

        res.json({
            totalSalary,
            totalDeductions,
            payableAmount,
            deductionsBreakdown,
            billingCycle: {
                start: new Date(year, month, 1).toISOString().split('T')[0],
                end: new Date(year, month + 1, 0).toISOString().split('T')[0],
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   POST api/maids/request-otp/:maidId
// @desc    Generate and send an OTP to the maid's mobile for attendance
exports.requestAttendanceOtp = async (req, res) => {
    try {
        const maid = await Maid.findById(req.params.maidId);
        if (!maid) { return res.status(404).json({ msg: 'Maid not found' }); }
        if (maid.user.toString() !== req.user.id) { return res.status(401).json({ msg: 'User not authorized' }); }

        const otp = otpGenerator.generate(6, { 
            upperCaseAlphabets: false, 
            specialChars: false,
            lowerCaseAlphabets: false
        });

        maid.otp = otp;
        maid.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
        await maid.save();

        console.log(`SIMULATING SMS to ${maid.mobile}: Your attendance OTP is ${otp}`);
        res.json({ msg: `OTP sent to ${maid.mobile}. It will expire in 5 minutes.` });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   POST api/maids/verify-otp/:maidId
// @desc    Verify OTP and mark attendance
exports.verifyOtpAndMarkAttendance = async (req, res) => {
    const { otp, taskName } = req.body;
    try {
        const maid = await Maid.findById(req.params.maidId);
        if (!maid) { return res.status(404).json({ msg: 'Maid not found' }); }

        if (maid.otp !== otp || maid.otpExpires < Date.now()) {
            maid.otp = undefined;
            maid.otpExpires = undefined;
            await maid.save();
            return res.status(400).json({ msg: 'OTP is invalid or has expired' });
        }

        maid.attendance.unshift({
            date: new Date(),
            taskName: taskName,
            status: 'Present'
        });

        maid.otp = undefined;
        maid.otpExpires = undefined;
        await maid.save();

        res.json({ msg: `Attendance for ${maid.name} marked successfully.` });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};