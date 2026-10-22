import React, { useState, useEffect, useCallback } from 'react';
import { Factory, Cog, Gauge, ShieldCheck, Recycle, Wrench, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AlertsPanel from '../components/AlertsPanel';
import DashboardCharts from '../components/DashboardCharts';
import CountUp from '../components/CountUp';

const GRADS = {
  teal: ['linear-gradient(135deg,#0d9488,#2dd4bf)', '#14b8a6'],
  blue: ['linear-gradient(135deg,#2563eb,#60a5fa)', '#3b82f6'],
  amber: ['linear-gradient(135deg,#d97706,#fbbf24)', '#f59e0b'],
  green: ['linear-gradient(135deg,#15803d,#4ade80)', '#22c55e'],
  violet: ['linear-gradient(135deg,#7c3aed,#c084fc)', '#8b5cf6'],
  red: ['linear-gradient(135deg,#be123c,#fb7185)', '#f43f5e']
};

function Dashboard() {
  const { user } = useAuth();
  const [machines, setMachines] = useState([]);
  const [productionSummary, setProductionSummary] = useState({});
  const [qualitySummary, setQualitySummary] = useState({});
  const [wasteSummary, setWasteSummary] = useState({});
  const [dueMaintenance, setDueMaintenance] = useState({ count: 0 });
  const [alerts, setAlerts] = useState({ alerts: [] });
  const [productionRecords, setProductionRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true);
    const r = await Promise.allSettled([
      api.get('/machines'), api.get('/production/summary'), api.get('/quality/summary'),
      api.get('/waste/summary'), api.get('/maintenance/due'), api.get('/alerts'), api.get('/production')
    ]);
    const get = (i, fallback) => (r[i].status === 'fulfilled' ? r[i].value.data : fallback);
    setMachines(get(0, []));
    setProductionSummary(get(1, {}));
    setQualitySummary(get(2, {}));
    setWasteSummary(get(3, {}));
    setDueMaintenance(get(4, { count: 0 }));
    setAlerts(get(5, { alerts: [] }));
    setProductionRecords(get(6, []));
    setFailed(r.filter((x) => x.status === 'rejected').length);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  if (loading) return <div className="page"><div className="loader" /></div>;

  const running = machines.filter((m) => m.status === 'running').length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const eff = Number(productionSummary.avgEfficiency) || 0;
  const pass = Number(qualitySummary.passRate) || 0;
  const prod = Number(productionSummary.totalActual) || 0;
  const waste = Number(wasteSummary.totalWaste) || 0;
  const due = dueMaintenance.count || 0;

  const kpis = [
    { label: 'Total Production', icon: Factory, g: GRADS.teal, value: prod, dec: Number.isInteger(prod) ? 0 : 1, suffix: ' t',
      sub: `Target ${productionSummary.totalTarget || 0} t` },
    { label: 'Machines Running', icon: Cog, g: GRADS.blue, value: running, dec: 0, suffix: ` / ${machines.length}`,
      sub: `${machines.length - running} idle or in maintenance`, bar: machines.length ? (running / machines.length) * 100 : 0 },
    { label: 'Efficiency', icon: Gauge, g: GRADS.amber, value: eff, dec: 1, suffix: '%', sub: 'Actual vs target output', bar: Math.min(100, eff) },
    { label: 'Quality Pass Rate', icon: ShieldCheck, g: GRADS.green, value: pass, dec: 1, suffix: '%',
      sub: `${qualitySummary.total || 0} ${qualitySummary.total === 1 ? 'inspection' : 'inspections'}`, bar: Math.min(100, pass) },
    { label: 'Total Waste', icon: Recycle, g: GRADS.violet, value: waste, dec: Number.isInteger(waste) ? 0 : 1, suffix: ' t', sub: 'All waste types combined' },
    { label: 'Maintenance Due', icon: Wrench, g: due > 0 ? GRADS.red : GRADS.green, value: due, dec: 0, suffix: '',
      sub: due > 0 ? 'Needs attention' : 'All on schedule' }
  ];

  return (
    <div className="page">
      <div className="dash-head">
        <div>
          <h1 className="dash-title">{greeting}, {user ? user.name : 'there'} 👋</h1>
          <div className="dash-sub">{today} · Paper Mill Management Dashboard</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="live-pill"><span className="live-dot" /> System online</span>
          <button className="refresh-btn" onClick={fetchDashboardData} disabled={refreshing}>
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {failed > 0 && <div className="warn-banner">⚠️ {failed} dashboard section(s) could not be loaded. Showing the data that is available.</div>}

      <div className="kpi-grid">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="kpi-card" style={{ '--kpi-grad': k.g[0], '--kpi-solid': k.g[1], animationDelay: `${i * 80}ms` }}>
              <div className="kpi-top">
                <span className="kpi-label">{k.label}</span>
                <span className="kpi-icon"><Icon size={22} /></span>
              </div>
              <div className="kpi-value"><CountUp value={k.value} decimals={k.dec} suffix={k.suffix} /></div>
              <div className="kpi-sub">{k.sub}</div>
              {k.bar !== undefined && <div className="bar"><span style={{ width: `${k.bar}%` }} /></div>}
            </div>
          );
        })}
      </div>

      <AlertsPanel alerts={alerts} />

      <DashboardCharts production={productionRecords} qualitySummary={qualitySummary} wasteSummary={wasteSummary} />

      <div className="panel">
        <h2 className="panel-title"><Cog size={20} /> Machine Status</h2>
        {machines.length === 0 && <p style={{ color: 'var(--muted)' }}>No machines yet.</p>}
        {machines.map((m) => {
          const total = (m.operatingHours || 0) + (m.downtime || 0);
          const avail = total > 0 ? (m.operatingHours / total) * 100 : 0;
          return (
            <div key={m._id} className="machine-row">
              <div className="m-name">
                <span className={`status-dot ${m.status}`} />
                <div>{m.name}<div className="m-id">{m.machineId}</div></div>
              </div>
              <div><span className={`pill ${m.status}`}>{m.status.toUpperCase()}</span></div>
              <div>
                <div className="avail-label"><span>Availability</span><span>{avail.toFixed(0)}%</span></div>
                <div className="bar" style={{ marginTop: 6 }}><span style={{ width: `${avail}%` }} /></div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--muted)' }}>{m.capacity} t capacity</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;