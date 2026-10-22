const Maintenance = require('../models/Maintenance');
const machineExists = require('../utils/machineCheck');

exports.getMaintenanceRecords = async (req, res) => {
  try {
    res.json(await Maintenance.find().sort({ scheduledDate: 1 }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMaintenanceById = async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Maintenance record not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createMaintenance = async (req, res) => {
  try {
    if (!(await machineExists(req.body.machineId))) {
      return res.status(400).json({ message: `Machine "${req.body.machineId}" does not exist` });
    }
    const saved = await new Maintenance(req.body).save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateMaintenance = async (req, res) => {
  try {
    if (req.body.machineId !== undefined && !(await machineExists(req.body.machineId))) {
      return res.status(400).json({ message: `Machine "${req.body.machineId}" does not exist` });
    }
    const updated = await Maintenance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updated) return res.status(404).json({ message: 'Maintenance record not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteMaintenance = async (req, res) => {
  try {
    const deleted = await Maintenance.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Maintenance record not found' });
    res.json({ message: 'Maintenance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDueMaintenance = async (req, res) => {
  try {
    const dueRecords = await Maintenance.find({
      scheduledDate: { $lte: new Date() },
      status: { $ne: 'completed' }
    });
    res.json({ count: dueRecords.length, records: dueRecords });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
