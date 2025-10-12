const Maid = require('../models/Maid');

// @desc    Add a new maid
// @route   POST /api/maids
// @access  Public (for now, will be private later)
const addMaid = async (req, res) => {
  try {
    const { name, mobileNo, address, pictureUrl, biometricId } = req.body;

    // Check if a maid with the same mobile number already exists
    const maidExists = await Maid.findOne({ mobileNo });
    if (maidExists) {
      return res.status(400).json({ message: 'Maid with this mobile number already exists.' });
    }

    // Create a new maid
    const maid = new Maid({
      name,
      mobileNo,
      address,
      pictureUrl,
      biometricId,
    });

    const createdMaid = await maid.save();
    res.status(201).json(createdMaid);

  } catch (error) {
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Get all maids
// @route   GET /api/maids
// @access  Public (for now)
const getAllMaids = async (req, res) => {
    try {
        const maids = await Maid.find({});
        res.status(200).json(maids);
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};


module.exports = {
  addMaid,
  getAllMaids,
};
