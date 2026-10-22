const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  machineId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Preventive', 'Breakdown'],
    default: 'Preventive'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  technician: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed'],
    default: 'scheduled'
  },
  description: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Maintenance', maintenanceSchema);