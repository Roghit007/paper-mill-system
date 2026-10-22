const Quality = require('../models/Quality');
const machineExists = require('../utils/machineCheck');

exports.getQualityRecords = async (req, res) => {
  try {
    res.json(await Quality.find().sort({ createdAt: -1 }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getQualityById = async (req, res) => {
  try {
    const record = await Quality.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Quality record not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// A new inspection must be linked to an existing machine
exports.createQuality = async (req, res) => {
  try {
    if (!req.body.machineId || !(await machineExists(req.body.machineId))) {
      return res.status(400).json({ message: 'Please select a valid machine for this inspection' });
    }
    res.status(201).json(await new Quality(req.body).save());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateQuality = async (req, res) => {
  try {
    if (req.body.machineId !== undefined && !(await machineExists(req.body.machineId))) {
      return res.status(400).json({ message: 'Please select a valid machine for this inspection' });
    }
    const updated = await Quality.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updated) return res.status(404).json({ message: 'Quality record not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteQuality = async (req, res) => {
  try {
    const deleted = await Quality.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Quality record not found' });
    res.json({ message: 'Quality record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getQualitySummary = async (req, res) => {
  try {
    const records = await Quality.find();
    const total = records.length;
    const passed = records.filter((r) => r.result === 'PASS').length;
    const failed = total - passed;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : 0;
    res.json({ total, passed, failed, passRate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};