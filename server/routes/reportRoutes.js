const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getReport } = require('../controllers/reportController');

// All roles may view reports
router.get('/', protect, getReport);

module.exports = router;