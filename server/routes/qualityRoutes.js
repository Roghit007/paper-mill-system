const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getQualityRecords,
  getQualityById,
  createQuality,
  updateQuality,
  deleteQuality,
  getQualitySummary
} = require('../controllers/qualityController');

// All routes require login
router.use(protect);

router.get('/summary', getQualitySummary);
router.get('/', getQualityRecords);
router.get('/:id', getQualityById);
router.post('/', authorize('admin', 'inspector'), createQuality);
router.put('/:id', authorize('admin', 'inspector'), updateQuality);
router.delete('/:id', authorize('admin'), deleteQuality);

module.exports = router;
