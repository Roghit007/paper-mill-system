const mongoose = require('mongoose');
const Waste = require('../models/Waste');
const Production = require('../models/Production');

// returns an error message, or null if the production record is valid
const checkProduction = async (id) => {
  if (!mongoose.isValidObjectId(id)) return 'Invalid production record';
  if (!(await Production.exists({ _id: id }))) return 'Production record does not exist';
  return null;
};

exports.getWasteRecords = async (req, res) => {
  try {
    res.json(await Waste.find().sort({ createdAt: -1 }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWasteById = async (req, res) => {
  try {
    const record = await Waste.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Waste record not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createWaste = async (req, res) => {
  try {
    const err = await checkProduction(req.body.productionId);
    if (err) return res.status(400).json({ message: err });
    res.status(201).json(await new Waste(req.body).save());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateWaste = async (req, res) => {
  try {
    if (req.body.productionId !== undefined) {
      const err = await checkProduction(req.body.productionId);
      if (err) return res.status(400).json({ message: err });
    }
    const updated = await Waste.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updated) return res.status(404).json({ message: 'Waste record not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteWaste = async (req, res) => {
  try {
    const deleted = await Waste.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Waste record not found' });
    res.json({ message: 'Waste record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWasteSummary = async (req, res) => {
  try {
    const records = await Waste.find();
    const totalWaste = records.reduce((s, r) => s + r.quantity, 0);
    const breakdown = {};
    records.forEach((r) => {
      breakdown[r.wasteType] = (breakdown[r.wasteType] || 0) + r.quantity;
    });
    res.json({ totalWaste, breakdown });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
