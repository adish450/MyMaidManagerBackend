const Maid = require('../models/Maid');
const mongoose = require('mongoose'); // Import mongoose
const twilio = require('twilio');

// Initialize Twilio client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

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
exports.getMaidById = async (req, res) => {
    try {
        const maid = await Maid.findById(req.params.maidId);
        if (!maid) { return res.status(404).json({ msg: 'Maid not found' }); }
        if (maid.user.toString() !== req.user.id) { return res.status(401).json({ msg: 'User not authorized' }); }
        res.json(maid);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
             return res.status(404).json({ msg: 'Maid not found' });
        }
        res.status(500).send('Server Error');
    }
};

// @route   POST api/maids
// @desc    Add a new maid for the logged-in user
exports.addMaid = async (req, res) => {
    console.log('[API] POST /api/maids - Received request to add a new maid.');
    console.log('[DEBUG] Request Body:', req.body); 

    const { name, mobile, address } = req.body;
    if (!name || !mobile || !address) {
        console.error('[ERROR] Validation failed: Missing required fields.');
        return res.status(400).json({ msg: 'Please provide name, mobile, and address.' });
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

// @route   PUT api/maids/:maidId
// @desc    Update a maid's details
// @access  Private
exports.updateMaid = async (req, res) => {
    console.log(`[API] PUT /api/maids/${req.params.maidId} - Received request to update maid.`);
    const { name, mobile, address } = req.body;
    
    // Build maid object
    const maidFields = {};
    if (name) maidFields.name = name;
    if (mobile) maidFields.mobile = mobile;
    if (address) maidFields.address = address;

    try {
        let maid = await Maid.findById(req.params.maidId);
        if (!maid) { 
            console.error(`[ERROR] Maid not found with ID: ${req.params.maidId}`);
            return res.status(404).json({ msg: 'Maid not found' }); 
        }

        // Make sure user owns the maid
        if (maid.user.toString() !== req.user.id) {
            console.error(`[ERROR] User ${req.user.id} not authorized to update maid ${req.params.maidId}`);
            return res.status(401).json({ msg: 'User not authorized' });
        }

        maid = await Maid.findByIdAndUpdate(
            req.params.maidId,
            { $set: maidFields },
            { new: true } // Return the modified document
        );

        console.log(`[SUCCESS] Maid ${maid.id} updated successfully.`);
        res.json(maid);
    } catch (err) {
        console.error('[ERROR] Database update error in updateMaid:', err.message);
        res.status(500).send('Server Error');
    }
};

// @route   DELETE api/maids/:maidId
// @desc    Delete a maid
// @access  Private
exports.deleteMaid = async (req, res) => {
    console.log(`[API] DELETE /api/maids/${req.params.maidId} - Received request to delete maid.`);
    try {
        let maid = await Maid.findById(req.params.maidId);
        if (!maid) { 
            console.error(`[ERROR] Maid not found with ID: ${req.params.maidId}`);
            return res.status(404).json({ msg: 'Maid not found' }); 
        }

        // Make sure user owns the maid
        if (maid.user.toString() !== req.user.id) {
            console.error(`[ERROR] User ${req.user.id} not authorized to delete maid ${req.params.maidId}`);
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await Maid.findByIdAndDelete(req.params.maidId);

        console.log(`[SUCCESS] Maid ${req.params.maidId} deleted successfully.`);
        res.json({ msg: 'Maid removed' });
    } catch (err) {
        console.error('[ERROR] Database delete error in deleteMaid:', err.message);
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

        // Create a new mongoose.Types.ObjectId for the task _id
        const newTaskId = new mongoose.Types.ObjectId();
        maid.tasks.unshift({ _id: newTaskId, name, price, frequency });

        await maid.save();
        res.json(maid.tasks); // Send back the updated tasks array

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   PUT api/maids/:maidId/tasks/:taskId
// @desc    Update a specific task for a maid
// @access  Private
exports.updateTask = async (req, res) => {
    const { name, price, frequency } = req.body;
    const { maidId, taskId } = req.params;

    if (!name || !price || !frequency) {
        return res.status(400).json({ msg: 'Please provide name, price, and frequency.' });
    }

    try {
        const maid = await Maid.findById(maidId);
        if (!maid) { 
            return res.status(404).json({ msg: 'Maid not found' }); 
        }
        if (maid.user.toString() !== req.user.id) { 
            return res.status(401).json({ msg: 'User not authorized' }); 
        }

        // Find the task within the maid's tasks array
        const task = maid.tasks.id(taskId);
        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        // Update the task properties
        task.name = name;
        task.price = price;
        task.frequency = frequency;

        await maid.save();
        
        // Return the updated maid document
        res.json(maid);

    } catch (err) {
        console.error('[ERROR] Database update error in updateTask:', err.message);
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

        // Find the task by its _id and pull it from the array
        maid.tasks.pull({ _id: req.params.taskId });
        
        await maid.save();
        res.json({ msg: 'Task removed' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   GET api/maids/:maidId/payroll
// @desc    Calculate payroll
exports.calculatePayroll = async (req, res) => {
    try {
        const maid = await Maid.findById(req.params.maidId);
        if (!maid) { return res.status(404).json({ msg: 'Maid not found' }); }
        if (maid.user.toString() !== req.user.id) { return res.status(401).json({ msg: 'User not authorized' }); }

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const startDate = new Date(Date.UTC(year, month, 1));
        const endDate = new Date(Date.UTC(year, month + 1, 1));
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let totalSalary = 0;
        let totalDeductions = 0;
        const deductionsBreakdown = [];
        
        for (const task of maid.tasks) {
            totalSalary += task.price;
            
            let expectedWorkDays = 0;
            const frequency = task.frequency.toLowerCase();

            // --- Updated Payroll Logic ---
            if (frequency === 'daily') {
                expectedWorkDays = daysInMonth;
            } else if (frequency.includes('alternate')) { // Handles "Alternate Days"
                expectedWorkDays = Math.ceil(daysInMonth / 2);
            } else if (frequency === 'weekly') {
                expectedWorkDays = 4; // Assuming 4 weeks in a month
            } else if (frequency === 'bi-weekly') { // Correctly handles "Bi-weekly"
                expectedWorkDays = 2; // As 2 days per month
            } else if (frequency === 'monthly') { // Correctly handles "Monthly"
                expectedWorkDays = 1; // As 1 day per month
            } else {
                // Default fallback (e.g., if frequency is not set, assume daily)
                expectedWorkDays = daysInMonth; 
            }
            // --- End of Updated Logic ---

            const costPerDay = expectedWorkDays > 0 ? task.price / expectedWorkDays : 0;
            
            // Filter for 'Present' status
            const daysWorked = maid.attendance.filter(r => 
                r.taskName === task.name && 
                r.status === 'Present' && // Only count "Present"
                new Date(r.date) >= startDate && 
                new Date(r.date) < endDate
            ).length;

            const missedDays = expectedWorkDays - daysWorked;
            if (missedDays > 0) {
                const deduction = missedDays * costPerDay;
                totalDeductions += deduction;
                deductionsBreakdown.push({ taskName: task.name, missedDays, deductionAmount: deduction });
            }
        }
        res.json({
            totalSalary, totalDeductions, payableAmount: totalSalary - totalDeductions,
            deductionsBreakdown, billingCycle: { start: startDate.toISOString().split('T')[0], end: new Date(year, month + 1, 0).toISOString().split('T')[0] }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   POST api/maids/request-otp/:maidId
// @desc    Request a verification OTP from Twilio Verify
exports.requestAttendanceOtp = async (req, res) => {
    try {
        const maid = await Maid.findById(req.params.maidId);
        if (!maid) { return res.status(404).json({ msg: 'Maid not found' }); }
        if (maid.user.toString() !== req.user.id) { return res.status(401).json({ msg: 'User not authorized' }); }

        const formattedPhoneNumber = formatToE164(maid.mobile);
        if (!formattedPhoneNumber) {
            return res.status(400).json({ msg: 'Maid does not have a valid mobile number.' });
        }

        await twilioClient.verify.v2.services(verifyServiceSid)
            .verifications
            .create({ to: formattedPhoneNumber, channel: 'sms' });
        
        
        res.json({ msg: `A verification code has been sent to ${maid.mobile}.` });

    } catch (err) {
        console.error("Twilio Verify Error:", err.message);
        if (err.code === 21211) {
             return res.status(400).send('Invalid phone number format. Ensure it includes a country code.');
        }
        res.status(500).send('Failed to send verification code.');
    }
};

// @route   POST api/maids/verify-otp/:maidId
// @desc    Verify the OTP with Twilio and mark attendance
exports.verifyOtpAndMarkAttendance = async (req, res) => {
    const { otp, taskName } = req.body;
    try {
        const maid = await Maid.findById(req.params.maidId);
        if (!maid) { return res.status(4404).json({ msg: 'Maid not found' }); }

        const formattedPhoneNumber = formatToE164(maid.mobile);
        if (!formattedPhoneNumber) {
            return res.status(400).json({ msg: 'Cannot verify OTP for a maid with no mobile number.' });
        }

        const verification_check = await twilioClient.verify.v2.services(verifyServiceSid)
            .verificationChecks
            .create({ to: formattedPhoneNumber, code: otp });

        if (verification_check.status === 'approved') {
            maid.attendance.unshift({
                date: new Date(), // Stored in UTC
                taskName: taskName,
                status: 'Present'
            });
            await maid.save();
            res.json({ msg: `Attendance for ${maid.name} marked successfully.` });
        } else {
            res.status(400).json({ msg: 'The OTP you entered is incorrect.' });
        }

    } catch (err) {
        console.error("Twilio Verification Check Error:", err.message);
        res.status(500).send('Server error during OTP verification.');
    }
};

// @route   POST api/maids/:maidId/attendance/manual
// @desc    Manually add an attendance record (e.g., mark as Absent)
exports.addManualAttendanceRecord = async (req, res) => {
    const { date, taskName, status } = req.body; 
    console.log('[API] POST /api/maids/:maidId/attendance/manual - Received request.');
    console.log('[DEBUG] Request Body:', req.body);

    if (!date || !taskName || !status) {
        console.error('[ERROR] Validation failed: Missing date, taskName, or status.');
        return res.status(400).json({ msg: 'Please provide date, task name, and status (e.g., Absent).' });
    }

    try {
        const maid = await Maid.findById(req.params.maidId);
        if (!maid) {
            console.error(`[ERROR] Maid not found with ID: ${req.params.maidId}`);
            return res.status(404).json({ msg: 'Maid not found' });
        }
        if (maid.user.toString() !== req.user.id) {
            console.error(`[ERROR] User ${req.user.id} not authorized for maid ${req.params.maidId}`);
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Create a Date object assuming the input 'date' (YYYY-MM-DD) is in UTC.
        const attendanceDate = new Date(Date.parse(date + 'T00:00:00.000Z'));
        if (isNaN(attendanceDate)) {
             console.error(`[ERROR] Invalid date format received: ${date}`);
             return res.status(400).json({ msg: 'Invalid date format. Please use YYYY-MM-DD.' });
        }

        maid.attendance.unshift({
            date: attendanceDate,
            taskName: taskName,
            status: status
        });

        await maid.save();
        console.log(`[SUCCESS] Manual attendance record added for maid "${maid.name}".`);
        res.json(maid.attendance); // Return the updated attendance list

    } catch (err) {
        console.error('[ERROR] Database save error in addManualAttendanceRecord:', err.message);
        res.status(500).send('Server Error');
    }
};