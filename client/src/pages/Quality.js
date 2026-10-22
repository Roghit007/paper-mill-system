import React, { useState, useEffect } from 'react';
import api from '../services/api';
import commonStyles from '../styles/common';
import { useAuth } from '../context/AuthContext';
import useListView from '../utils/useListView';
import { Toolbar, Pager } from '../components/ListTools';

const EMPTY = { machineId: '', batchId: '', gsm: '', moisture: '', thickness: '', result: 'PASS', remarks: '' };
const KEYS = ['machineId', 'batchId', 'result', 'remarks'];
const errMsg = (e) => e.response?.data?.message || e.message;

function Quality() {
  const { can } = useAuth();
  const canAdd = can('quality', 'write');
  const canDelete = can('quality', 'delete');

  const [records, setRecords] = useState([]);
  const [machines, setMachines] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY);
  const view = useListView(records, KEYS, 'createdAt');

  useEffect(() => { fetchRecords(); fetchMachines(); }, []);

  const fetchRecords = async () => {
    try {
      const res = await api.get('/quality');
      setRecords(res.data);
    } catch (e) { alert('Error: ' + errMsg(e)); }
  };

  const fetchMachines = async () => {
    try {
      const res = await api.get('/machines');
      setMachines(res.data);
    } catch (e) { console.error('Error fetching machines:', e); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const toggleForm = () => {
    setEditingId(null);
    setFormData(EMPTY);
    setShowForm(!showForm || editingId !== null);
  };

  const startEdit = (r) => {
    setEditingId(r._id);
    setFormData({
      machineId: r.machineId || '', batchId: r.batchId, gsm: r.gsm, moisture: r.moisture,
      thickness: r.thickness, result: r.result, remarks: r.remarks || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await api.put(`/quality/${editingId}`, formData);
      else await api.post('/quality', formData);
      setFormData(EMPTY); setEditingId(null); setShowForm(false);
      fetchRecords();
    } catch (error) { alert('Error: ' + errMsg(error)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this inspection?')) return;
    try {
      await api.delete(`/quality/${id}`);
      fetchRecords();
    } catch (error) { alert('Error: ' + errMsg(error)); }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.heading}>Quality Inspection</h1>
        {canAdd && (
          <button style={styles.addBtn} onClick={toggleForm}>
            {showForm ? 'Cancel' : '+ Add Inspection'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <select style={styles.input} name="machineId" value={formData.machineId} onChange={handleChange} required>
            <option value="">Select Machine</option>
            {machines.map((m) => (
              <option key={m._id} value={m.machineId}>{m.machineId} — {m.name}</option>
            ))}
          </select>
          <input style={styles.input} name="batchId" placeholder="Batch ID (e.g. BATCH-101)" value={formData.batchId} onChange={handleChange} required />
          <input style={styles.input} name="gsm" type="number" min="1" placeholder="GSM" value={formData.gsm} onChange={handleChange} required />
          <input style={styles.input} name="moisture" type="number" min="0" max="100" step="0.1" placeholder="Moisture % (0-100)" value={formData.moisture} onChange={handleChange} required />
          <input style={styles.input} name="thickness" type="number" min="0" step="0.01" placeholder="Thickness (mm)" value={formData.thickness} onChange={handleChange} required />
          <select style={styles.input} name="result" value={formData.result} onChange={handleChange}>
            <option value="PASS">PASS</option>
            <option value="FAIL">FAIL</option>
          </select>
          <input style={styles.input} name="remarks" placeholder="Remarks (optional)" value={formData.remarks} onChange={handleChange} />
          <button type="submit" style={styles.submitBtn}>{editingId ? 'Update Inspection' : 'Save Inspection'}</button>
        </form>
      )}

      <Toolbar view={view} dates />

      <table style={styles.table}>
        <thead>
          <tr style={styles.tableHeader}>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Machine</th>
            <th style={styles.th}>Batch ID</th>
            <th style={styles.th}>GSM</th>
            <th style={styles.th}>Moisture %</th>
            <th style={styles.th}>Thickness</th>
            <th style={styles.th}>Result</th>
            <th style={styles.th}>Remarks</th>
            {(canAdd || canDelete) && <th style={styles.th}>Action</th>}
          </tr>
        </thead>
        <tbody>
          {view.rows.map((r) => (
            <tr key={r._id} style={styles.tr}>
              <td style={styles.td}>{new Date(r.createdAt).toLocaleDateString('en-GB')}</td>
              <td style={styles.td}>{r.machineId || '—'}</td>
              <td style={styles.td}>{r.batchId}</td>
              <td style={styles.td}>{r.gsm}</td>
              <td style={styles.td}>{r.moisture}%</td>
              <td style={styles.td}>{r.thickness}</td>
              <td style={styles.td}>
                <span style={r.result === 'PASS' ? styles.pass : styles.fail}>{r.result}</span>
              </td>
              <td style={styles.td}>{r.remarks || '-'}</td>
              {(canAdd || canDelete) && (
                <td style={styles.td}>
                  {canAdd && <button style={styles.deleteBtn} title="Edit" onClick={() => startEdit(r)}>✏️</button>}
                  {canDelete && <button style={styles.deleteBtn} title="Delete" onClick={() => handleDelete(r._id)}>🗑️</button>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <Pager view={view} />
    </div>
  );
}

const styles = {
  ...commonStyles,
  pass: { color: '#16a34a', fontWeight: 'bold', backgroundColor: '#dcfce7', padding: '4px 10px', borderRadius: '6px' },
  fail: { color: '#dc2626', fontWeight: 'bold', backgroundColor: '#fee2e2', padding: '4px 10px', borderRadius: '6px' }
};

export default Quality;