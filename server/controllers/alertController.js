const Machine = require('../models/Machine');
const Production = require('../models/Production');
const Quality = require('../models/Quality');
const Maintenance = require('../models/Maintenance');

// Business rules. Thresholds are assumptions - adjust them to your mill's targets.
const THRESHOLDS = {
  minEfficiency: 80,          // % - latest production record per machine
  criticalEfficiency: 60,     // % - below this the alert is "critical"
  maxRejectRate: 5,           // % of actual output rejected
  qualityWindowDays: 7,       // look-back window for failed inspections
  maxDowntimeRatio: 20        // % of total time (operating + downtime) spent in downtime
};

const day = (d) => new Date(d).toISOString().slice(0, 10);

// @desc Rule-based alerts calculated from existing data (no AI)
// GET /api/alerts
exports.getAlerts = async (req, res) => {
  try {
    const alerts = [];
    const now = new Date();
    const cutoff = new Date(now.getTime() - THRESHOLDS.qualityWindowDays * 24 * 60 * 60 * 1000);

    const [machines, production, failedQuality, overdue] = await Promise.all([
      Machine.find(),
      Production.find().sort({ date: -1 }),
      Quality.find({ result: 'FAIL', createdAt: { $gte: cutoff } }),
      Maintenance.find({ scheduledDate: { $lte: now }, status: { $ne: 'completed' } })
    ]);

    // Rule 1 & 2: efficiency and rejection rate (latest record of each machine)
    const latest = {};
    production.forEach((p) => {
      if (!latest[p.machineId]) latest[p.machineId] = p;
    });

    Object.values(latest).forEach((p) => {
      if (p.target > 0) {
        const efficiency = (p.actual / p.target) * 100;
        if (efficiency < THRESHOLDS.minEfficiency) {
          alerts.push({
            severity: efficiency < THRESHOLDS.criticalEfficiency ? 'critical' : 'warning',
            module: 'Production',
            message: `${p.machineId}: latest efficiency is ${efficiency.toFixed(1)}% (below ${THRESHOLDS.minEfficiency}%)`
          });
        }
      }
      if (p.actual > 0) {
        const rejectRate = (p.rejected / p.actual) * 100;
        if (rejectRate > THRESHOLDS.maxRejectRate) {
          alerts.push({
            severity: 'warning',
            module: 'Production',
            message: `${p.machineId}: ${rejectRate.toFixed(1)}% of latest output was rejected (limit ${THRESHOLDS.maxRejectRate}%)`
          });
        }
      }
    });

    // Rule 3: failed quality inspections in the last N days - one alert per machine
    const failedByMachine = {};
    failedQuality.forEach((q) => {
      const key = q.machineId || 'Unassigned machine';
      if (!failedByMachine[key]) failedByMachine[key] = [];
      failedByMachine[key].push(q.batchId);
    });
    Object.entries(failedByMachine).forEach(([machine, batches]) => {
      alerts.push({
        severity: batches.length >= 2 ? 'critical' : 'warning',
        module: 'Quality',
        message: `${machine}: ${batches.length} failed inspection(s) in the last ${THRESHOLDS.qualityWindowDays} days (batches: ${batches.slice(0, 5).join(', ')})`
      });
    });

    // Rule 4: overdue maintenance
    overdue.forEach((m) => {
      alerts.push({
        severity: m.type === 'Breakdown' ? 'critical' : 'warning',
        module: 'Maintenance',
        message: `${m.machineId}: ${m.type} maintenance scheduled ${day(m.scheduledDate)} is overdue (${m.status})`
      });
    });

    // Rule 5: high downtime ratio, and machines currently under maintenance
    machines.forEach((m) => {
      const total = m.operatingHours + m.downtime;
      if (total > 0) {
        const ratio = (m.downtime / total) * 100;
        if (ratio > THRESHOLDS.maxDowntimeRatio) {
          alerts.push({
            severity: 'warning',
            module: 'Machines',
            message: `${m.machineId} (${m.name}): downtime is ${ratio.toFixed(1)}% of total time (limit ${THRESHOLDS.maxDowntimeRatio}%)`
          });
        }
      }
      if (m.status === 'maintenance') {
        alerts.push({
          severity: 'info',
          module: 'Machines',
          message: `${m.machineId} (${m.name}) is currently under maintenance`
        });
      }
    });

    const order = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => order[a.severity] - order[b.severity]);

    res.json({ count: alerts.length, alerts, thresholds: THRESHOLDS });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};