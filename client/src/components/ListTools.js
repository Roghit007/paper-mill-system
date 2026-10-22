import React from 'react';
import { Search, Download } from 'lucide-react';
import { PAGE_SIZE } from '../utils/useListView';
import { downloadCsv, autoColumns } from '../utils/csv';

// Search box (+ optional date range) and an Export CSV button shown above a list
export function Toolbar({ view, dates }) {
  const exportCsv = () => {
    const name = window.location.pathname.replace(/\//g, '') || 'export';
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`${name}-${stamp}.csv`, autoColumns(view.filtered), view.filtered);
  };

  return (
    <div className="toolbar">
      <div className="search-box">
        <Search size={16} />
        <input placeholder="Search..." value={view.search} onChange={(e) => view.setSearch(e.target.value)} />
      </div>
      {dates && (
        <>
          <label>From <input type="date" value={view.from} onChange={(e) => view.setFrom(e.target.value)} /></label>
          <label>To <input type="date" value={view.to} onChange={(e) => view.setTo(e.target.value)} /></label>
        </>
      )}
      {(view.search || view.from || view.to) && <button className="clear-btn" onClick={view.clear}>Clear</button>}
      <button className="clear-btn" onClick={exportCsv} disabled={view.total === 0} title="Download the filtered list as CSV" style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <Download size={15} /> Export CSV
      </button>
    </div>
  );
}

// Previous / Next buttons under a list
export function Pager({ view }) {
  if (view.total === 0) return <p className="pager-info" style={{ marginTop: 16 }}>No records found.</p>;
  const start = (view.page - 1) * PAGE_SIZE + 1;
  const end = Math.min(view.page * PAGE_SIZE, view.total);
  return (
    <div className="pager">
      <span className="pager-info">Showing {start}–{end} of {view.total}</span>
      <span>
        <button className="pager-btn" disabled={view.page <= 1} onClick={() => view.setPage(view.page - 1)}>‹ Prev</button>
        <span className="pager-info"> Page {view.page} / {view.pages} </span>
        <button className="pager-btn" disabled={view.page >= view.pages} onClick={() => view.setPage(view.page + 1)}>Next ›</button>
      </span>
    </div>
  );
}