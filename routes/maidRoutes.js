const express = require('express');
const router = express.Router();
const { addMaid, getAllMaids } = require('../controllers/maidController');

// Route to add a new maid and get all maids
router.route('/').post(addMaid).get(getAllMaids);

// We will add routes for deleting, updating, tasks, and attendance later.

module.exports = router;
