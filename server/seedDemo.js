// Fills the LOCAL database with demo data so the app looks complete.
// Run from the server folder:   node seedDemo.js
// Wipe old demo data first:     node seedDemo.js --reset      (users are never deleted)
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('./models/User');
const Machine = require('./models/Machine');
const Production = require('./models/Production');
const Quality = require('./models/Quality');
const Maintenance = require('./models/Maintenance');
const Waste = require('./models/Waste');

const DEMO_PASSWORD = 'Demo@1234'; // for the operator / inspector demo accounts
const ago = (days) => new Date(Date.now() - days * 864e5);

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to', mongoose.connection.host);

    if (process.argv.includes('--reset')) {
      await Promise.all([Machine, Production, Quality, Maintenance, Waste].map((m) => m.deleteMany({})));
      console.log('Old machine / production / quality / maintenance / waste data removed.');
    } else if (await Machine.exists({})) {
      console.log('The database already has machines. Nothing was changed.');
      console.log('Run "node seedDemo.js --reset" to replace the demo data.');
      return;
    }

    // ---- demo users (only created if the email does not exist yet) ----
    const users = [
      { name: 'Siva', email: 'operator@yourmill.com', role: 'operator' },
      { name: 'Ramesh', email: 'inspector@yourmill.com', role: 'inspector' }
    ];
    for (const u of users) {
      if (!(await User.exists({ email: u.email }))) {
        await User.create({ ...u, password: DEMO_PASSWORD });
        console.log(`User created: ${u.email} / ${DEMO_PASSWORD}`);
      }
    }

    // ---- machines ----
    await Machine.insertMany([
      { machineId: 'PM-001', name: 'Paper Machine 01', status: 'running', capacity: 20, operatingHours: 18.5, downtime: 1.5 },
      { machineId: 'PM-002', name: 'Paper Machine 02', status: 'idle', capacity: 15, operatingHours: 12, downtime: 3 },
      { machineId: 'PM-003', name: 'Paper Machine 03', status: 'maintenance', capacity: 22, operatingHours: 20, downtime: 2 },
      { machineId: 'PM-004', name: 'Paper Machine 04', status: 'running', capacity: 18, operatingHours: 18, downtime: 24 }
    ]);

    // ---- production: [daysAgo, machine, grade, target, actual, rejected] ----
    const prodRows = [
      [28, 'PM-001', 'Kraft', 120, 112, 4], [21, 'PM-001', 'A4', 100, 96, 3], [14, 'PM-001', 'Letter', 110, 104, 4],
      [7, 'PM-001', 'A4', 100, 97, 3], [1, 'PM-001', 'Kraft', 120, 115, 4],
      [27, 'PM-002', 'A3', 90, 85, 3], [20, 'PM-002', 'Letter', 90, 86, 3], [13, 'PM-002', 'A3', 80, 78, 2],
      [6, 'PM-002', 'Letter', 90, 84, 3], [2, 'PM-002', 'A3', 80, 77, 2],
      [26, 'PM-004', 'A4', 70, 66, 2], [19, 'PM-004', 'A4', 70, 64, 2], [12, 'PM-004', 'A4', 70, 60, 3],
      [5, 'PM-004', 'A4', 70, 55, 4], [1, 'PM-004', 'A4', 70, 52, 4],
      [25, 'PM-003', 'Kraft', 100, 95, 3], [15, 'PM-003', 'Kraft', 100, 94, 3]
    ];
    const prod = await Production.insertMany(prodRows.map(([d, machineId, grade, target, actual, rejected]) => ({
      machineId, grade, target, actual, rejected, date: ago(d), createdAt: ago(d), updatedAt: ago(d)
    })));
    const prodId = {};
    prodRows.forEach((r, i) => { prodId[`${r[1]}-${r[0]}`] = prod[i]._id; });

    // ---- waste: [production key, type, quantity, reason] ----
    const wasteRows = [
      ['PM-001-21', 'Quality Rejection', 1.2, 'Wet edge defect on reel'],
      ['PM-002-13', 'Machine Waste', 0.8, 'Felt change and web break'],
      ['PM-001-28', 'Other', 0.5, 'Sample cuts for lab testing'],
      ['PM-002-20', 'Process Waste', 1.8, 'Trim loss at slitter'],
      ['PM-004-5', 'Process Waste', 1.4, 'Startup trim loss'],
      ['PM-003-15', 'Machine Waste', 0.9, 'Dryer cleaning']
    ];
    await Waste.insertMany(wasteRows.map(([key, wasteType, quantity, reason]) => {
      const days = Number(key.split('-')[2]);
      return { productionId: prodId[key], wasteType, quantity, reason, createdAt: ago(days), updatedAt: ago(days) };
    }));

    // ---- quality: [daysAgo, machine, batch, gsm, moisture, thickness, result, remarks] ----
    const qualityRows = [
      [25, 'PM-001', 'BATCH-101', 80, 6.5, 0.12, 'PASS', ''],
      [14, 'PM-001', 'BATCH-102', 80, 5.8, 0.10, 'PASS', ''],
      [10, 'PM-002', 'BATCH-103', 100, 6.2, 0.12, 'PASS', ''],
      [8, 'PM-004', 'BATCH-104', 120, 7.1, 0.15, 'PASS', ''],
      [2, 'PM-002', 'BATCH-105', 80, 9.4, 0.11, 'FAIL', 'Moisture above limit'],
      [1, 'PM-001', 'BATCH-106', 90, 6.0, 0.11, 'PASS', '']
    ];
    await Quality.insertMany(qualityRows.map(([d, machineId, batchId, gsm, moisture, thickness, result, remarks]) => ({
      machineId, batchId, gsm, moisture, thickness, result, remarks, createdAt: ago(d), updatedAt: ago(d)
    })));

    // ---- maintenance: [daysFromNow, machine, type, technician, status, description] ----
    const maintRows = [
      [10, 'PM-001', 'Preventive', 'Ramesh', 'scheduled', 'Gearbox oil change'],
      [14, 'PM-002', 'Preventive', 'Kumar', 'scheduled', 'Dryer section inspection'],
      [-12, 'PM-002', 'Preventive', 'Kumar', 'completed', 'Quarterly lubrication'],
      [-1, 'PM-004', 'Breakdown', 'Suresh', 'in-progress', 'Bearing failure in press section'],
      [2, 'PM-003', 'Preventive', 'Suresh', 'in-progress', 'Wire section overhaul']
    ];
    await Maintenance.insertMany(maintRows.map(([d, machineId, type, technician, status, description]) => ({
      machineId, type, technician, status, description, scheduledDate: ago(-d)
    })));

    console.log('Demo data loaded: 4 machines, 17 production, 6 waste, 6 quality, 5 maintenance records.');
    console.log('Open the app and press Refresh on the dashboard.');
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();