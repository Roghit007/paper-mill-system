const mongoose = require('mongoose');

const qualitySchema = new mongoose.Schema({
  // Machine that produced the batch (older records may be blank until edited)
  machineId: { type: String, trim: true, default: '' },
  batchId: { type: String, required: true, trim: true },
  gsm: { type: Number, required: true, min: [1, 'GSM must be greater than 0'] },
  moisture: {
    type: Number,
    required: true,
    min: [0, 'Moisture cannot be below 0%'],
    max: [100, 'Moisture cannot be above 100%']
  },
  thickness: { type: Number, required: true, min: [0.01, 'Thickness must be greater than 0'] },
  result: { type: String, enum: ['PASS', 'FAIL'], required: true },
  remarks: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Quality', qualitySchema);