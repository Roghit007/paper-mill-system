import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import commonStyles from '../styles/common';
import { useAuth } from '../context/AuthContext';
import useListView from '../utils/useListView';
import { Toolbar, Pager } from '../components/ListTools';

const EMPTY = { productionId: '', wasteType: 'Process Waste', quantity: '', reason: '' };
const KEYS = ['label', 'wasteType', 'reason'];
const errMsg = (e) => e.response?.data?.message || e.message;

function Waste() {
  const { can } = useAuth();
  const canAdd = can('waste', 'write');
  const canDelete = can('waste', 'delete');

  const [records, setRecords] = useState([]);
  const [productionRecords, setProductionRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY);

  // add a readable "Machine — Grade" label to each waste record
  const enriched = useMemo(() => records.map((r) => {
    const p = productionRecords.find((x) => x._id === r.productionId);
    return { ...r, label: p ? `${p.machineId} — ${p.grade}` : 'Deleted production record' };
  }), [records, productionRecords]);
  const view = useListView(enriched, KEYS, 'createdAt');

  useEffect(() => { fetchRecords(); fetchProductionRecords(); }, []);

  const fetchRecords = async () => {
    try {
      const res = await api.get('/waste');
      setRecords(res.data);
    } catch (e) { alert('Error: ' + errMsg(e)); }
  };

  const fetchProductionRecords = async () => {
    try {
      const res = await api.get('/production');
      setProductionRecords(res.data);
    } catch (e) { console.error('Error fetching production records:', e); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const toggleForm = () => {
    setEditingId(null);
    setFormData(EMPTY);
    setShowForm(!showForm || editingId !== null);
  };

  const startEdit = (r) => {
    setEditingId(r._id);
    setFormData({ productionId: r.productionId, wasteType: r.wasteType, quantity: r.quantity, reason: r.reason });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await api.put(`/waste/${editingId}`, formData);
      else await api.post('/waste', formData);
      setFormData(EMPTY); setEditingId(null); setShowForm(false);
      fetchRecords();
    } catch (error) { alert('Error: ' + errMsg(error)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this waste record?')) return;
    try {
      await api.delete(`/waste/${id}`);
      fetchRecords();
    } catch (error) { alert('Error: ' + errMsg(error)); }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.heading}>Waste Tracking</h1>
        {canAdd && (
          <button style={styles.addBtn} onClick={toggleForm}>
            {showForm ? 'Cancel' : '+ Add Waste Record'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <select style={styles.input} name="productionId" value={formData.productionId} onChange={handleChange} required>
            <option value="">Select Production Record</option>
            {productionRecords.map((p) => (
              <option key={p._id} value={p._id}>
                {p.machineId} — {p.grade} ({new Date(p.createdAt).toLocaleDateString('en-GB')})
              </option>
            ))}
          </select>
          <select style={styles.input} name="wasteType" value={formData.wasteType} onChange={handleChange} required>
            <option value="Process Waste">Process Waste</option>
            <option value="Quality Rejection">Quality Rejection</option>
            <option value="Machine Waste">Machine Waste</option>
            <option value="Other">Other</option>
          </select>
          <input style={styles.input} name="quantity" type="number" step="0.01" min="0" placeholder="Quantity (tons)" value={formData.quantity} onChange={handleChange} required />
          <input style={styles.input} name="reason" placeholder="Reason" value={formData.reason} onChange={handleChange} required />
          <button type="submit" style={styles.submitBtn}>{editingId ? 'Update Record' : 'Save Record'}</button>
        </form>
      )}

      <Toolbar view={view} dates />

      <table style={styles.table}>
        <thead>
          <tr style={styles.tableHeader}>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Production Record</th>
            <th style={styles.th}>Waste Type</th>
            <th style={styles.th}>Quantity</th>
            <th style={styles.th}>Reason</th>
            {(canAdd || canDelete) && <th style={styles.th}>Action</th>}
          </tr>
        </thead>
        <tbody>
          {view.rows.map((r) => (
            <tr key={r._id} style={styles.tr}>
              <td style={styles.td}>{new Date(r.createdAt).toLocaleDateString('en-GB')}</td>
              <td style={styles.td}>{r.label}</td>
              <td style={styles.td}>{r.wasteType}</td>
              <td style={styles.td}>{r.quantity} tons</td>
              <td style={styles.td}>{r.reason}</td>
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

export default Waste;