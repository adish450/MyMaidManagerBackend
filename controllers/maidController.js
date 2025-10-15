const Maid = require('../models/Maid');
const twilio = require('twilio');
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

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

// @route   GET api/maids/:maidId
// @desc    Get a single maid by their ID
// @access  Private
exports.getMaidById = async (req, res) => {
    try {
        const maid = await Maid.findById(req.params.maidId);

        // Check if maid exists
        if (!maid) {
            return res.status(404).json({ msg: 'Maid not found' });
        }

        // Check if the maid belongs to the user making the request
        if (maid.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        res.json(maid);
    } catch (err) {
        console.error(err.message);
        // If the ID format is invalid, Mongoose throws an error
        if (err.kind === 'ObjectId') {
             return res.status(404).json({ msg: 'Maid not found' });
        }
        res.status(500).send('Server Error');
    }
};

// @route   POST api/maids
// @desc    Add a new maid for the logged-in user
exports.addMaid = async (req, res) => {
    const { name, mobileNo, address } = req.body;
    if (!name || !mobileNo || !address) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }
    try {
        const newMaid = new Maid({ name, mobileNo, address, user: req.user.id });
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

// Helper function to format phone number to E.164
const formatToE164 = (phoneNumber) => {
    console.log(`[DEBUG] Formatting phone number. Original: "${phoneNumber}"`);
    if (!phoneNumber || typeof phoneNumber !== 'string') {
        console.log('[DEBUG] Phone number is null, undefined, or not a string. Returning empty.');
        return '';
    }
    if (phoneNumber.startsWith('+')) {
        console.log('[DEBUG] Phone number already in E.164 format.');
        return phoneNumber;
    }
    const formatted = `+${phoneNumber}`;
    console.log(`[DEBUG] Formatted number: "${formatted}"`);
    return formatted;
};

// @route   POST api/maids
// @desc    Add a new maid for the logged-in user
exports.addMaid = async (req, res) => {
    console.log('[API] POST /api/maids - Received request to add a new maid.');
    console.log('[DEBUG] Request Body:', req.body); // Log incoming data

    const { name, mobile, address } = req.body;
    if (!name || !mobile || !address) {
        console.error('[ERROR] Validation failed: Missing required fields.');
        return res.status(400).json({ msg: 'Please enter all fields' });
    }
    try {
        const newMaid = new Maid({ name, mobile, address, user: req.user.id });
        console.log('[DEBUG] Saving new maid document to database...');
        const maid = await newMaid.save();
        console.log('[SUCCESS] Maid saved successfully. Maid ID:', maid.id);
        res.json(maid);
    } catch (err) {
        console.error('[ERROR] Database save error in addMaid:', err.message);
        res.status(500).send('Server Error');
    }
};

// @route   POST api/maids/request-otp/:maidId
// @desc    Request a verification OTP from Twilio Verify
exports.requestAttendanceOtp = async (req, res) => {
    console.log(`[API] POST /api/maids/request-otp/${req.params.maidId} - Received request for OTP.`);
    try {
        const maid = await Maid.findById(req.params.maidId);
        if (!maid) {
            console.error(`[ERROR] Maid not found with ID: ${req.params.maidId}`);
            return res.status(404).json({ msg: 'Maid not found' });
        }
        console.log(`[DEBUG] Found maid: "${maid.name}". Checking mobile number.`);
        
        const formattedPhoneNumber = formatToE164(maid.mobile);

        if (!formattedPhoneNumber) {
            console.error(`[ERROR] Maid "${maid.name}" has an invalid or missing mobile number.`);
            return res.status(400).json({ msg: 'Maid does not have a valid mobile number.' });
        }

        console.log(`[DEBUG] Requesting OTP from Twilio for number: ${formattedPhoneNumber}`);
        await twilioClient.verify.v2.services(verifyServiceSid)
            .verifications
            .create({ to: formattedPhoneNumber, channel: 'sms' });
        
        console.log(`[SUCCESS] Twilio accepted the request to send OTP to ${formattedPhoneNumber}.`);
        res.json({ msg: `A verification code has been sent to ${maid.mobile}.` });

    } catch (err) {
        console.error("[ERROR] Twilio Verify API Error:", err.message);
        if (err.code === 21211) {
             return res.status(400).send('Invalid phone number format. Twilio rejected the number.');
        }
        res.status(500).send('Failed to send verification code.');
    }
};

// @route   POST api/maids/verify-otp/:maidId
// @desc    Verify the OTP with Twilio and mark attendance
exports.verifyOtpAndMarkAttendance = async (req, res) => {
    const { otp, taskName } = req.body;
    console.log(`[API] POST /api/maids/verify-otp/${req.params.maidId} - Received request to verify OTP.`);
    console.log(`[DEBUG] OTP: "${otp}", Task: "${taskName}"`);

    try {
        const maid = await Maid.findById(req.params.maidId);
        if (!maid) {
            console.error(`[ERROR] Maid not found with ID: ${req.params.maidId}`);
            return res.status(404).json({ msg: 'Maid not found' });
        }

        const formattedPhoneNumber = formatToE164(maid.mobile);
        if (!formattedPhoneNumber) {
            console.error(`[ERROR] Cannot verify OTP for maid "${maid.name}" with no mobile number.`);
            return res.status(400).json({ msg: 'Cannot verify OTP for a maid with no mobile number.' });
        }

        console.log(`[DEBUG] Sending verification check to Twilio for number: ${formattedPhoneNumber}`);
        const verification_check = await twilioClient.verify.v2.services(verifyServiceSid)
            .verificationChecks
            .create({ to: formattedPhoneNumber, code: otp });
        
        console.log(`[DEBUG] Twilio verification status: "${verification_check.status}"`);

        if (verification_check.status === 'approved') {
            maid.attendance.unshift({
                date: new Date(),
                taskName: taskName,
                status: 'Present'
            });
            await maid.save();
            console.log(`[SUCCESS] Attendance marked for "${maid.name}" for task "${taskName}".`);
            res.json({ msg: `Attendance for ${maid.name} marked successfully.` });
        } else {
            console.warn(`[WARN] OTP verification failed for maid "${maid.name}". Status: ${verification_check.status}`);
            res.status(400).json({ msg: 'The OTP you entered is incorrect.' });
        }

    } catch (err) {
        console.error("[ERROR] Twilio Verification Check Error:", err.message);
        res.status(500).send('Server error during OTP verification.');
    }
};