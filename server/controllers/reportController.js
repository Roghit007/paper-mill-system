const Machine = require('../models/Machine');
const Production = require('../models/Production');
const Quality = require('../models/Quality');
const Waste = require('../models/Waste');
const Maintenance = require('../models/Maintenance');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const r2 = (n) => Math.round(n * 100) / 100;
const pct = (a, b) => (b > 0 ? r2((a / b) * 100) : 0);
const dayOf = (d) => new Date(d).toISOString().slice(0, 10);

const rangeFilter = (field, from, to) => {
  const cond = {};
  if (from) cond.$gte = new Date(`${from}T00:00:00.000Z`);
  if (to) cond.$lte = new Date(`${to}T23:59:59.999Z`);
  return Object.keys(cond).length ? { [field]: cond } : {};
};

// @desc Management report for a date range
// GET /api/reports?from=YYYY-MM-DD&to=YYYY-MM-DD   (both optional = all time)
exports.getReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    if ((from && !DATE_RE.test(from)) || (to && !DATE_RE.test(to))) {
      return res.status(400).json({ message: 'Dates must be in YYYY-MM-DD format' });
    }

    const [machines, production, quality, waste, maintenance] = await Promise.all([
      Machine.find().sort({ machineId: 1 }),
      Production.find(rangeFilter('date', from, to)),
      Quality.find(rangeFilter('createdAt', from, to)),
      Waste.find(rangeFilter('createdAt', from, to)),
      Maintenance.find(rangeFilter('scheduledDate', from, to)).sort({ scheduledDate: 1 })
    ]);

    const nameOf = {};
    machines.forEach((m) => { nameOf[m.machineId] = m.name; });

    // ---- Production ----
    const pm = {};
    production.forEach((p) => {
      if (!pm[p.machineId]) pm[p.machineId] = { machineId: p.machineId, name: nameOf[p.machineId] || '', records: 0, target: 0, actual: 0, rejected: 0 };
      pm[p.machineId].records += 1;
      pm[p.machineId].target += p.target;
      pm[p.machineId].actual += p.actual;
      pm[p.machineId].rejected += p.rejected;
    });
    const byMachine = Object.values(pm)
      .map((x) => ({
        ...x,
        target: r2(x.target), actual: r2(x.actual), rejected: r2(x.rejected),
        good: r2(x.actual - x.rejected),
        efficiency: pct(x.actual, x.target),
        rejectRate: pct(x.rejected, x.actual)
      }))
      .sort((a, b) => a.machineId.localeCompare(b.machineId));
    const tt = byMachine.reduce((s, x) => s + x.target, 0);
    const ta = byMachine.reduce((s, x) => s + x.actual, 0);
    const tr = byMachine.reduce((s, x) => s + x.rejected, 0);

    // ---- Quality ----
    const qm = {};
    quality.forEach((q) => {
      const k = q.machineId || 'Unassigned';
      if (!qm[k]) qm[k] = { machineId: k, total: 0, passed: 0, failed: 0 };
      qm[k].total += 1;
      if (q.result === 'PASS') qm[k].passed += 1; else qm[k].failed += 1;
    });
    const qualityByMachine = Object.values(qm).map((x) => ({ ...x, passRate: pct(x.passed, x.total) }));
    const qPassed = quality.filter((q) => q.result === 'PASS').length;
    const failedBatches = quality
      .filter((q) => q.result === 'FAIL')
      .map((q) => ({ batchId: q.batchId, machineId: q.machineId || 'Unassigned', date: dayOf(q.createdAt), remarks: q.remarks || '' }));

    // ---- Waste ----
    const wt = {};
    waste.forEach((w) => { wt[w.wasteType] = (wt[w.wasteType] || 0) + w.quantity; });
    const wasteTotal = Object.values(wt).reduce((s, v) => s + v, 0);
    const wasteByType = Object.entries(wt).map(([type, quantity]) => ({
      type, quantity: r2(quantity), share: pct(quantity, wasteTotal)
    }));

    // ---- Maintenance ----
    const now = new Date();
    const records = maintenance.map((m) => ({
      machineId: m.machineId, type: m.type, date: dayOf(m.scheduledDate),
      technician: m.technician, status: m.status, description: m.description || '',
      overdue: m.status !== 'completed' && m.scheduledDate < now
    }));
    const count = (s) => records.filter((r) => r.status === s).length;

    // ---- Machines ----
    const machineList = machines.map((m) => ({
      machineId: m.machineId, name: m.name, status: m.status, capacity: m.capacity,
      operatingHours: m.operatingHours, downtime: m.downtime,
      availability: pct(m.operatingHours, m.operatingHours + m.downtime)
    }));

    res.json({
      period: { from: from || '', to: to || '' },
      generatedAt: new Date().toISOString(),
      production: {
        totals: {
          records: production.length, target: r2(tt), actual: r2(ta), rejected: r2(tr),
          good: r2(ta - tr), efficiency: pct(ta, tt), rejectRate: pct(tr, ta)
        },
        byMachine
      },
      quality: {
        totals: { total: quality.length, passed: qPassed, failed: quality.length - qPassed, passRate: pct(qPassed, quality.length) },
        byMachine: qualityByMachine,
        failedBatches
      },
      waste: { total: r2(wasteTotal), byType: wasteByType },
      maintenance: {
        totals: {
          total: records.length, scheduled: count('scheduled'), inProgress: count('in-progress'),
          completed: count('completed'), overdue: records.filter((r) => r.overdue).length
        },
        records
      },
      machines: machineList
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};