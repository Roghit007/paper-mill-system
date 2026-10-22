const Machine = require('../models/Machine');

// true if a machine with this machineId (e.g. "PM-001") exists
module.exports = async (machineId) =>
  !!(await Machine.exists({ machineId: String(machineId || '').trim() }));
