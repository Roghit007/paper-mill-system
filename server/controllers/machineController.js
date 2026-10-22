const Machine = require('../models/Machine');
const Production = require('../models/Production');
const Maintenance = require('../models/Maintenance');

exports.getMachines = async (req, res) => {
  try {
    res.json(await Machine.find());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMachineById = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) return res.status(404).json({ message: 'Machine not found' });
    res.json(machine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createMachine = async (req, res) => {
  try {
    const saved = await new Machine(req.body).save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateMachine = async (req, res) => {
  try {
    // machineId is the link used by other modules, so it cannot be changed
    delete req.body.machineId;
    const updated = await Machine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updated) return res.status(404).json({ message: 'Machine not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Blocked while production / maintenance records still use this machine
exports.deleteMachine = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) return res.status(404).json({ message: 'Machine not found' });

    const [prod, maint] = await Promise.all([
      Production.exists({ machineId: machine.machineId }),
      Maintenance.exists({ machineId: machine.machineId })
    ]);
    if (prod || maint) {
      return res.status(409).json({
        message: `Cannot delete ${machine.machineId}: it still has production or maintenance records. Delete those first.`
      });
    }

    await machine.deleteOne();
    res.json({ message: 'Machine deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
