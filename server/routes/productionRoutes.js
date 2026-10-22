const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getProductionRecords,
  getProductionById,
  createProduction,
  updateProduction,
  deleteProduction,
  getProductionSummary
} = require('../controllers/productionController');

// All routes require login
router.use(protect);

router.get('/summary', getProductionSummary);
router.get('/', getProductionRecords);
router.get('/:id', getProductionById);
router.post('/', authorize('admin', 'operator'), createProduction);
router.put('/:id', authorize('admin', 'operator'), updateProduction);
router.delete('/:id', authorize('admin'), deleteProduction);

module.exports = router;
