// Shared look for every page. Colours come from CSS variables in theme.css.
const commonStyles = {
  container: { padding: '32px', fontFamily: 'var(--font-body)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', gap: '12px', flexWrap: 'wrap' },
  heading: { fontSize: '30px', fontWeight: 700, color: 'var(--text)', margin: 0, fontFamily: 'var(--font-head)' },
  addBtn: { background: 'var(--grad-primary)', color: 'white', border: 'none', padding: '11px 22px', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, boxShadow: '0 8px 20px rgba(20,184,166,0.35)' },
  form: { background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px', borderRadius: '16px', marginBottom: '26px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', boxShadow: 'var(--shadow)' },
  input: { padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: '14px' },
  submitBtn: { background: 'var(--grad-success)', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', gridColumn: 'span 2' },
  table: { width: '100%', borderCollapse: 'collapse', background: 'var(--surface)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' },
  tableHeader: { background: 'var(--thead)' },
  th: { padding: '15px 16px', color: 'var(--thead-text)', textAlign: 'left', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' },
  tr: { borderBottom: '1px solid var(--border)' },
  td: { padding: '14px 16px', fontSize: '14px', color: 'var(--text)' },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '6px 8px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '20px' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', padding: '20px', borderRadius: '16px', boxShadow: 'var(--shadow)', color: 'var(--text)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
};

export default commonStyles;