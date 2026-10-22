const mongoose = require('mongoose');

const wasteSchema = new mongoose.Schema({
  // Real reference to a production record (existing string IDs still work)
  productionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Production', required: true },
  wasteType: {
    type: String,
    enum: ['Process Waste', 'Quality Rejection', 'Machine Waste', 'Other'],
    required: true
  },
  quantity: { type: Number, required: true, min: [0, 'Quantity cannot be negative'] },
  reason: { type: String, required: true, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Waste', wasteSchema);
