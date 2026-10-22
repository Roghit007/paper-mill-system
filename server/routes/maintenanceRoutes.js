const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getMaintenanceRecords,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  getDueMaintenance
} = require('../controllers/maintenanceController');

// All routes require login
router.use(protect);

router.get('/due', getDueMaintenance);
router.get('/', getMaintenanceRecords);
router.get('/:id', getMaintenanceById);
router.post('/', authorize('admin', 'operator'), createMaintenance);
router.put('/:id', authorize('admin', 'operator'), updateMaintenance);
router.delete('/:id', authorize('admin'), deleteMaintenance);

module.exports = router;
