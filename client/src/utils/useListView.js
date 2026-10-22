import { useState, useMemo } from 'react';

export const PAGE_SIZE = 10;

// Search + optional date range + pagination for any list of records.
// searchKeys: fields to search in. dateKey: field used for the date filter (optional).
export default function useListView(records, searchKeys, dateKey) {
  const [search, setSearchRaw] = useState('');
  const [from, setFromRaw] = useState('');
  const [to, setToRaw] = useState('');
  const [page, setPage] = useState(1);

  const keysId = searchKeys.join(',');
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (q && !searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(q))) return false;
      if (dateKey) {
        const d = String(r[dateKey] || '').slice(0, 10);
        if (from && d < from) return false;
        if (to && d > to) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, search, from, to, keysId, dateKey]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const reset = (setter) => (v) => { setter(v); setPage(1); };

  return {
    rows, filtered, total: filtered.length, page: current, pages, setPage,
    search, setSearch: reset(setSearchRaw),
    from, setFrom: reset(setFromRaw),
    to, setTo: reset(setToRaw),
    clear: () => { setSearchRaw(''); setFromRaw(''); setToRaw(''); setPage(1); }
  };
}