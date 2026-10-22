const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getMachines,
  getMachineById,
  createMachine,
  updateMachine,
  deleteMachine
} = require('../controllers/machineController');

// All routes require login
router.use(protect);

router.get('/', getMachines);
router.get('/:id', getMachineById);
router.post('/', authorize('admin'), createMachine);
router.put('/:id', authorize('admin'), updateMachine);
router.delete('/:id', authorize('admin'), deleteMachine);

module.exports = router;
