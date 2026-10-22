import React, { useState, useEffect } from 'react';
import api from '../services/api';
import commonStyles from '../styles/common';
import { useAuth } from '../context/AuthContext';
import useListView from '../utils/useListView';
import { Toolbar, Pager } from '../components/ListTools';

const EMPTY = { machineId: '', grade: '', target: '', actual: '', rejected: '' };
const KEYS = ['machineId', 'grade'];
const errMsg = (e) => e.response?.data?.message || e.message;

function Production() {
  const { can } = useAuth();
  const canAdd = can('production', 'write');
  const canDelete = can('production', 'delete');

  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY);
  const view = useListView(records, KEYS, 'date');

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    try {
      const res = await api.get('/production');
      setRecords(res.data);
    } catch (e) { alert('Error: ' + errMsg(e)); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const toggleForm = () => {
    setEditingId(null);
    setFormData(EMPTY);
    setShowForm(!showForm || editingId !== null);
  };

  const startEdit = (r) => {
    setEditingId(r._id);
    setFormData({ machineId: r.machineId, grade: r.grade, target: r.target, actual: r.actual, rejected: r.rejected });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await api.put(`/production/${editingId}`, formData);
      else await api.post('/production', formData);
      setFormData(EMPTY); setEditingId(null); setShowForm(false);
      fetchRecords();
    } catch (error) { alert('Error: ' + errMsg(error)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record? Linked waste records will also be deleted.')) return;
    try {
      await api.delete(`/production/${id}`);
      fetchRecords();
    } catch (error) { alert('Error: ' + errMsg(error)); }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.heading}>Production Tracking</h1>
        {canAdd && (
          <button style={styles.addBtn} onClick={toggleForm}>
            {showForm ? 'Cancel' : '+ Add Production Record'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <input style={styles.input} name="machineId" placeholder="Machine ID (e.g. PM-001)" value={formData.machineId} onChange={handleChange} required />
          <input style={styles.input} name="grade" placeholder="Paper Grade (e.g. A4)" value={formData.grade} onChange={handleChange} required />
          <input style={styles.input} name="target" type="number" min="0" step="any" placeholder="Target (tons)" value={formData.target} onChange={handleChange} required />
          <input style={styles.input} name="actual" type="number" min="0" step="any" placeholder="Actual Production (tons)" value={formData.actual} onChange={handleChange} required />
          <input style={styles.input} name="rejected" type="number" min="0" step="any" placeholder="Rejected (tons)" value={formData.rejected} onChange={handleChange} />
          <button type="submit" style={styles.submitBtn}>{editingId ? 'Update Record' : 'Save Record'}</button>
        </form>
      )}

      <Toolbar view={view} dates />

      <table style={styles.table}>
        <thead>
          <tr style={styles.tableHeader}>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Machine</th>
            <th style={styles.th}>Grade</th>
            <th style={styles.th}>Target</th>
            <th style={styles.th}>Actual</th>
            <th style={styles.th}>Rejected</th>
            <th style={styles.th}>Good Production</th>
            <th style={styles.th}>Efficiency</th>
            {(canAdd || canDelete) && <th style={styles.th}>Action</th>}
          </tr>
        </thead>
        <tbody>
          {view.rows.map((r) => (
            <tr key={r._id} style={styles.tr}>
              <td style={styles.td}>{new Date(r.date).toLocaleDateString('en-GB')}</td>
              <td style={styles.td}>{r.machineId}</td>
              <td style={styles.td}>{r.grade}</td>
              <td style={styles.td}>{r.target}</td>
              <td style={styles.td}>{r.actual}</td>
              <td style={styles.td}>{r.rejected}</td>
              <td style={styles.td}>{r.goodProduction}</td>
              <td style={styles.td}>{r.efficiency}%</td>
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

const styles = commonStyles;

export default Production;