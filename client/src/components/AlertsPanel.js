import React from 'react';
import { ShieldAlert, AlertTriangle, Info, CheckCircle2, Bell } from 'lucide-react';

const ICONS = { critical: ShieldAlert, warning: AlertTriangle, info: Info };

// Shows alerts calculated by GET /api/alerts (simple business rules, no AI)
function AlertsPanel({ alerts }) {
  const list = (alerts && alerts.alerts) || [];
  const t = alerts && alerts.thresholds;

  return (
    <div className="panel">
      <h2 className="panel-title">
        <Bell size={20} /> Alerts <span className="count-badge">{list.length}</span>
      </h2>

      {list.length === 0 ? (
        <div className="alert-empty"><CheckCircle2 size={20} /> No active alerts. All monitored rules are within limits.</div>
      ) : (
        list.map((a, i) => {
          const Icon = ICONS[a.severity] || Info;
          return (
            <div key={i} className={`alert-item ${a.severity}`} style={{ animationDelay: `${i * 70}ms` }}>
              <span className="msg"><Icon size={20} /><span><strong>{a.module}</strong> — {a.message}</span></span>
              <span className="sev-badge"><span>{a.severity.toUpperCase()}</span></span>
            </div>
          );
        })
      )}

      {t && (
        <p className="rules-note">
          Rules: efficiency below {t.minEfficiency}% (critical below {t.criticalEfficiency}%) · rejection above {t.maxRejectRate}% ·
          failed inspections in last {t.qualityWindowDays} days · overdue maintenance · downtime above {t.maxDowntimeRatio}% of total time
        </p>
      )}
    </div>
  );
}

export default AlertsPanel;