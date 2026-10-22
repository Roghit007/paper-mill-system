const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getWasteRecords,
  getWasteById,
  createWaste,
  updateWaste,
  deleteWaste,
  getWasteSummary
} = require('../controllers/wasteController');

// All routes require login
router.use(protect);

router.get('/summary', getWasteSummary);
router.get('/', getWasteRecords);
router.get('/:id', getWasteById);
router.post('/', authorize('admin', 'inspector'), createWaste);
router.put('/:id', authorize('admin', 'inspector'), updateWaste);
router.delete('/:id', authorize('admin'), deleteWaste);

module.exports = router;
