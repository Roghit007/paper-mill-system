const mongoose = require('mongoose');

const productionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  machineId: { type: String, required: true, trim: true },
  grade: { type: String, required: true, trim: true },
  target: { type: Number, required: true, min: [0.01, 'Target must be greater than 0'] },
  actual: { type: Number, required: true, min: [0, 'Actual cannot be negative'] },
  rejected: {
    type: Number,
    default: 0,
    min: [0, 'Rejected cannot be negative'],
    validate: {
      // works with doc.save(), where "this" is the whole record
      validator: function (v) { return v <= this.actual; },
      message: 'Rejected cannot be more than actual production'
    }
  }
}, { timestamps: true });

productionSchema.virtual('goodProduction').get(function () {
  return this.actual - this.rejected;
});

productionSchema.virtual('efficiency').get(function () {
  return this.target > 0 ? ((this.actual / this.target) * 100).toFixed(2) : '0.00';
});

productionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Production', productionSchema);
