const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
  machineId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  status: { type: String, enum: ['running', 'idle', 'maintenance'], default: 'idle' },
  capacity: { type: Number, required: true, min: [0, 'Capacity cannot be negative'] },
  operatingHours: { type: Number, default: 0, min: [0, 'Operating hours cannot be negative'] },
  downtime: { type: Number, default: 0, min: [0, 'Downtime cannot be negative'] }
}, { timestamps: true });

module.exports = mongoose.model('Machine', machineSchema);
