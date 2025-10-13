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

// @route   POST api/maids/request-otp/:maidId
// @desc    Generate and send an OTP to the maid's mobile for attendance
exports.requestAttendanceOtp = async (req, res) => {
    try {
        const maid = await Maid.findById(req.params.maidId);
        if (!maid) {
            return res.status(404).json({ msg: 'Maid not found' });
        }
        
        // Ensure the maid belongs to the logged-in user
        if (maid.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Generate a 6-digit OTP
        const otp = otpGenerator.generate(6, { 
            upperCaseAlphabets: false, 
            specialChars: false,
            lowerCaseAlphabets: false
        });

        // Set OTP expiration to 5 minutes from now
        maid.otp = otp;
        maid.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
        await maid.save();

        // --- SMS Sending Logic (Simulation) ---
        // In a real application, you would integrate an SMS gateway like Twilio or AWS SNS here.
        // For example: await sendSms(maid.mobile, `Your attendance OTP is ${otp}`);
        console.log(`SIMULATING SMS to ${maid.mobile}: Your attendance OTP is ${otp}`);
        // --- End Simulation ---

        res.json({ msg: `OTP has been sent to ${maid.mobile}. It will expire in 5 minutes.` });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   POST api/maids/verify-otp/:maidId
// @desc    Verify OTP and mark attendance
exports.verifyOtpAndMarkAttendance = async (req, res) => {
    const { otp } = req.body;

    try {
        const maid = await Maid.findById(req.params.maidId);
        if (!maid) {
            return res.status(404).json({ msg: 'Maid not found' });
        }

        // Check if OTP is valid and not expired
        if (maid.otp !== otp || maid.otpExpires < Date.now()) {
            // Clear the invalid OTP
            maid.otp = undefined;
            maid.otpExpires = undefined;
            await maid.save();
            return res.status(400).json({ msg: 'OTP is invalid or has expired' });
        }

        // OTP is valid, so mark attendance.
        // For now, we'll just add a simple record. This can be expanded later.
        maid.attendance.push({
            date: new Date(),
            taskName: 'General', // Placeholder for now
            status: 'Present'
        });

        // Clear the OTP fields after successful verification
        maid.otp = undefined;
        maid.otpExpires = undefined;
        await maid.save();

        res.json({ msg: `Attendance for ${maid.name} marked successfully.` });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};