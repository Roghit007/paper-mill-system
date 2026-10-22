const Production = require('../models/Production');
const Waste = require('../models/Waste');
const machineExists = require('../utils/machineCheck');

exports.getProductionRecords = async (req, res) => {
  try {
    res.json(await Production.find().sort({ date: -1 }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProductionById = async (req, res) => {
  try {
    const record = await Production.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Production record not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createProduction = async (req, res) => {
  try {
    if (!(await machineExists(req.body.machineId))) {
      return res.status(400).json({ message: `Machine "${req.body.machineId}" does not exist` });
    }
    const saved = await new Production(req.body).save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Loads the record, applies changes and saves, so all validators run on the full record
exports.updateProduction = async (req, res) => {
  try {
    const record = await Production.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Production record not found' });

    if (req.body.machineId !== undefined && !(await machineExists(req.body.machineId))) {
      return res.status(400).json({ message: `Machine "${req.body.machineId}" does not exist` });
    }
    record.set(req.body);
    res.json(await record.save());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Also removes waste records linked to this production record
exports.deleteProduction = async (req, res) => {
  try {
    const deleted = await Production.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Production record not found' });
    await Waste.deleteMany({ productionId: deleted._id });
    res.json({ message: 'Production record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProductionSummary = async (req, res) => {
  try {
    const records = await Production.find();
    const totalTarget = records.reduce((s, r) => s + r.target, 0);
    const totalActual = records.reduce((s, r) => s + r.actual, 0);
    const totalRejected = records.reduce((s, r) => s + r.rejected, 0);
    const avgEfficiency = totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(2) : 0;

    res.json({
      totalTarget,
      totalActual,
      totalRejected,
      totalGoodProduction: totalActual - totalRejected,
      avgEfficiency
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
