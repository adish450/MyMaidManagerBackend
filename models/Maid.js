const mongoose = require('mongoose');

const maidSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  mobileNo: {
    type: String,
    required: true,
    unique: true, // Assuming each mobile number is unique
  },
  address: {
    type: String,
    required: true,
  },
  pictureUrl: {
    type: String, // URL to the stored image
    required: false,
  },
  // Biometric data is complex. We'll store a reference or identifier here.
  // The actual biometric file would be stored elsewhere (e.g., AWS S3).
  biometricId: {
    type: String,
    required: false, // Make this required once you implement the feature
  },
  // We will add tasks and attendance later
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

const Maid = mongoose.model('Maid', maidSchema);

module.exports = Maid;
