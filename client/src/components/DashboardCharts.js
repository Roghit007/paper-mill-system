import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell
} from 'recharts';

const WASTE_COLORS = ['#f59e0b', '#14b8a6', '#6366f1', '#ec4899', '#3b82f6'];
const tooltipStyle = {
  contentStyle: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  cursor: { fill: 'rgba(20,184,166,0.08)' }
};
const legendText = (v) => <span style={{ color: 'var(--text)' }}>{v}</span>;

// All charts use real data already fetched by the Dashboard from the existing APIs.
function DashboardCharts({ production, qualitySummary, wasteSummary }) {
  const byMachine = {};
  (production || []).forEach((p) => {
    if (!byMachine[p.machineId]) byMachine[p.machineId] = { machine: p.machineId, Target: 0, Actual: 0, Rejected: 0 };
    byMachine[p.machineId].Target += p.target;
    byMachine[p.machineId].Actual += p.actual;
    byMachine[p.machineId].Rejected += p.rejected;
  });
  const productionData = Object.values(byMachine);

  const qualityData = [
    { name: 'Pass', value: qualitySummary.passed || 0, color: '#22c55e' },
    { name: 'Fail', value: qualitySummary.failed || 0, color: '#f43f5e' }
  ].filter((d) => d.value > 0);

  const wasteData = Object.entries(wasteSummary.breakdown || {}).map(([type, qty]) => ({ type, Quantity: qty }));

  return (
    <div className="charts-grid" style={styles.grid}>
      <div className="panel" style={{ gridColumn: 'span 2', marginBottom: 0, minWidth: 0 }}>
        <h3 className="panel-title">Production by Machine (tons)</h3>
        {productionData.length === 0 ? (
          <p style={styles.empty}>No production records yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={productionData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="machine" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Legend itemSorter={null} formatter={legendText} />
              <Bar dataKey="Target" fill="#94a3b8" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Actual" fill="#14b8a6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Rejected" fill="#f43f5e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="panel" style={{ marginBottom: 0, minWidth: 0 }}>
        <h3 className="panel-title">Quality Inspections</h3>
        {qualityData.length === 0 ? (
          <p style={styles.empty}>No inspections yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={270}>
            <PieChart>
              <Pie data={qualityData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={3}
                   label={({ name, value }) => `${name}: ${value}`} stroke="none">
                {qualityData.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend formatter={legendText} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="panel" style={{ gridColumn: 'span 3', marginBottom: 0, minWidth: 0 }}>
        <h3 className="panel-title">Waste by Type (tons)</h3>
        {wasteData.length === 0 ? (
          <p style={styles.empty}>No waste records yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={wasteData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="type" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="Quantity" radius={[8, 8, 0, 0]} maxBarSize={90}>
                {wasteData.map((d, i) => <Cell key={d.type} fill={WASTE_COLORS[i % WASTE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '26px' },
  empty: { color: 'var(--muted)', fontSize: '14px' }
};

export default DashboardCharts;