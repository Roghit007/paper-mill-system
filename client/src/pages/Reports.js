import React, { useState, useEffect, useCallback } from 'react';
import { Download, Printer } from 'lucide-react';
import api from '../services/api';
import commonStyles from '../styles/common';
import CountUp from '../components/CountUp';
import { downloadCsv } from '../utils/csv';

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };

const PRESETS = [
  { label: 'Last 7 days', range: () => [daysAgo(6), iso(new Date())] },
  { label: 'Last 30 days', range: () => [daysAgo(29), iso(new Date())] },
  { label: 'This month', range: () => { const t = new Date(); return [iso(new Date(t.getFullYear(), t.getMonth(), 1)), iso(t)]; } },
  { label: 'All time', range: () => ['', ''] }
];

const KPI = {
  teal: ['linear-gradient(135deg,#0d9488,#2dd4bf)', '#14b8a6'],
  amber: ['linear-gradient(135deg,#d97706,#fbbf24)', '#f59e0b'],
  green: ['linear-gradient(135deg,#15803d,#4ade80)', '#22c55e'],
  violet: ['linear-gradient(135deg,#7c3aed,#c084fc)', '#8b5cf6'],
  red: ['linear-gradient(135deg,#be123c,#fb7185)', '#f43f5e'],
  blue: ['linear-gradient(135deg,#2563eb,#60a5fa)', '#3b82f6']
};

function Section({ title, onCsv, children }) {
  return (
    <div className="panel report-section">
      <div className="report-head">
        <h2 className="panel-title" style={{ margin: 0 }}>{title}</h2>
        {onCsv && <button className="refresh-btn no-print" onClick={onCsv}><Download size={15} /> CSV</button>}
      </div>
      {children}
    </div>
  );
}

function Table({ cols, rows }) {
  if (!rows || rows.length === 0) return <p style={{ color: 'var(--muted)', fontSize: 14 }}>No data for this period.</p>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={commonStyles.table}>
        <thead>
          <tr style={commonStyles.tableHeader}>{cols.map((c) => <th key={c.label} style={commonStyles.th}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={commonStyles.tr}>
              {cols.map((c) => <td key={c.label} style={commonStyles.td}>{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const csvCols = (cols) => cols.map((c) => ({ label: c.label, value: c.csv || ((r) => r[c.key]) }));

function Reports() {
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(iso(new Date()));
  const [preset, setPreset] = useState('Last 30 days');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reports', { params: { from, to } });
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const applyPreset = (p) => { const [f, t] = p.range(); setFrom(f); setTo(t); setPreset(p.label); };
  const period = from || to ? `${from || 'start'} to ${to || 'today'}` : 'All time';
  const stamp = iso(new Date());

  // ---- table definitions (also used for the CSV downloads) ----
  const prodCols = [
    { label: 'Machine', key: 'machineId', render: (r) => `${r.machineId}${r.name ? ' — ' + r.name : ''}`, csv: (r) => `${r.machineId} ${r.name}` },
    { label: 'Records', key: 'records' }, { label: 'Target (t)', key: 'target' }, { label: 'Actual (t)', key: 'actual' },
    { label: 'Rejected (t)', key: 'rejected' }, { label: 'Good (t)', key: 'good' },
    { label: 'Efficiency %', key: 'efficiency' }, { label: 'Reject rate %', key: 'rejectRate' }
  ];
  const qualCols = [
    { label: 'Machine', key: 'machineId' }, { label: 'Inspections', key: 'total' }, { label: 'Passed', key: 'passed' },
    { label: 'Failed', key: 'failed' }, { label: 'Pass rate %', key: 'passRate' }
  ];
  const failCols = [
    { label: 'Batch', key: 'batchId' }, { label: 'Machine', key: 'machineId' }, { label: 'Date', key: 'date' }, { label: 'Remarks', key: 'remarks' }
  ];
  const wasteCols = [
    { label: 'Waste type', key: 'type' }, { label: 'Quantity (t)', key: 'quantity' }, { label: 'Share %', key: 'share' }
  ];
  const maintCols = [
    { label: 'Machine', key: 'machineId' }, { label: 'Type', key: 'type' }, { label: 'Date', key: 'date' },
    { label: 'Technician', key: 'technician' },
    { label: 'Status', key: 'status', render: (r) => `${r.status}${r.overdue ? ' (OVERDUE)' : ''}`, csv: (r) => `${r.status}${r.overdue ? ' (OVERDUE)' : ''}` },
    { label: 'Description', key: 'description' }
  ];
  const machCols = [
    { label: 'Machine', key: 'machineId' }, { label: 'Name', key: 'name' }, { label: 'Status', key: 'status' },
    { label: 'Capacity (t)', key: 'capacity' }, { label: 'Operating hrs', key: 'operatingHours' },
    { label: 'Downtime hrs', key: 'downtime' }, { label: 'Availability %', key: 'availability' }
  ];

  const csv = (name, cols, rows) => downloadCsv(`${name}-${stamp}.csv`, csvCols(cols), rows);

  const kpis = data && [
    { label: 'Total Production', value: data.production.totals.actual, suffix: ' t', c: KPI.teal, sub: `Target ${data.production.totals.target} t` },
    { label: 'Efficiency', value: data.production.totals.efficiency, dec: 1, suffix: '%', c: KPI.amber, sub: 'Actual vs target' },
    { label: 'Reject Rate', value: data.production.totals.rejectRate, dec: 1, suffix: '%', c: KPI.red, sub: `${data.production.totals.rejected} t rejected` },
    { label: 'Quality Pass Rate', value: data.quality.totals.passRate, dec: 1, suffix: '%', c: KPI.green, sub: `${data.quality.totals.failed} failed of ${data.quality.totals.total}` },
    { label: 'Total Waste', value: data.waste.total, dec: Number.isInteger(data.waste.total) ? 0 : 1, suffix: ' t', c: KPI.violet, sub: `${data.waste.byType.length} waste type(s)` },
    { label: 'Maintenance Jobs', value: data.maintenance.totals.total, c: KPI.blue, sub: `${data.maintenance.totals.completed} done · ${data.maintenance.totals.overdue} overdue` }
  ];

  return (
    <div className="page">
      <div className="dash-head">
        <div>
          <h1 className="dash-title">Reports</h1>
          <div className="dash-sub">Management summary · {period}</div>
        </div>
        <button className="refresh-btn no-print" onClick={() => window.print()}><Printer size={15} /> Print / Save as PDF</button>
      </div>

      <div className="report-filters no-print">
        {PRESETS.map((p) => (
          <button key={p.label} className={`preset-btn${preset === p.label ? ' active' : ''}`} onClick={() => applyPreset(p)}>{p.label}</button>
        ))}
        <label className="report-date">From <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPreset('Custom'); }} /></label>
        <label className="report-date">To <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPreset('Custom'); }} /></label>
      </div>

      <div className="print-title">
        <h1>Paper Mill Report</h1>
        <p>Period: {period} · Generated {new Date().toLocaleString('en-GB')}</p>
      </div>

      {error && <div className="warn-banner">⚠️ {error}</div>}
      {loading && !data && <div className="loader" />}

      {data && (
        <>
          <div className="kpi-grid">
            {kpis.map((k, i) => (
              <div key={k.label} className="kpi-card" style={{ '--kpi-grad': k.c[0], '--kpi-solid': k.c[1], animationDelay: `${i * 60}ms` }}>
                <div className="kpi-label" style={{ marginBottom: 10 }}>{k.label}</div>
                <div className="kpi-value"><CountUp value={k.value} decimals={k.dec || 0} suffix={k.suffix || ''} /></div>
                <div className="kpi-sub">{k.sub}</div>
              </div>
            ))}
          </div>

          <Section title="Production by machine" onCsv={() => csv('production-report', prodCols, data.production.byMachine)}>
            <Table cols={prodCols} rows={data.production.byMachine} />
          </Section>

          <Section title="Quality by machine" onCsv={() => csv('quality-report', qualCols, data.quality.byMachine)}>
            <Table cols={qualCols} rows={data.quality.byMachine} />
          </Section>

          <Section title="Failed batches" onCsv={() => csv('failed-batches', failCols, data.quality.failedBatches)}>
            <Table cols={failCols} rows={data.quality.failedBatches} />
          </Section>

          <Section title="Waste by type" onCsv={() => csv('waste-report', wasteCols, data.waste.byType)}>
            <Table cols={wasteCols} rows={data.waste.byType} />
          </Section>

          <Section title="Maintenance jobs" onCsv={() => csv('maintenance-report', maintCols, data.maintenance.records)}>
            <Table cols={maintCols} rows={data.maintenance.records} />
          </Section>

          <Section title="Machine availability" onCsv={() => csv('machines-report', machCols, data.machines)}>
            <Table cols={machCols} rows={data.machines} />
          </Section>
        </>
      )}
    </div>
  );
}

export default Reports;