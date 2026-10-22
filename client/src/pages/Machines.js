import React, { useState, useEffect } from 'react';
import api from '../services/api';
import commonStyles from '../styles/common';
import { useAuth } from '../context/AuthContext';
import useListView from '../utils/useListView';
import { Toolbar, Pager } from '../components/ListTools';

const EMPTY = { machineId: '', name: '', status: 'idle', capacity: '', operatingHours: '', downtime: '' };
const KEYS = ['machineId', 'name', 'status'];
const errMsg = (e) => e.response?.data?.message || e.message;

function Machines() {
  const { can } = useAuth();
  const canAdd = can('machines', 'write');
  const canDelete = can('machines', 'delete');

  const [machines, setMachines] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY);
  const view = useListView(machines, KEYS);

  useEffect(() => { fetchMachines(); }, []);

  const fetchMachines = async () => {
    try {
      const res = await api.get('/machines');
      setMachines(res.data);
    } catch (e) { alert('Error: ' + errMsg(e)); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const toggleForm = () => {
    setEditingId(null);
    setFormData(EMPTY);
    setShowForm(!showForm || editingId !== null);
  };

  const startEdit = (m) => {
    setEditingId(m._id);
    setFormData({
      machineId: m.machineId, name: m.name, status: m.status,
      capacity: m.capacity, operatingHours: m.operatingHours, downtime: m.downtime
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await api.put(`/machines/${editingId}`, formData);
      else await api.post('/machines', formData);
      setFormData(EMPTY); setEditingId(null); setShowForm(false);
      fetchMachines();
    } catch (error) { alert('Error: ' + errMsg(error)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this machine?')) return;
    try {
      await api.delete(`/machines/${id}`);
      fetchMachines();
    } catch (error) { alert('Error: ' + errMsg(error)); }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.heading}>Machine Management</h1>
        {canAdd && (
          <button style={styles.addBtn} onClick={toggleForm}>
            {showForm ? 'Cancel' : '+ Add Machine'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <input style={styles.input} name="machineId" placeholder="Machine ID (e.g. PM-004)" value={formData.machineId} onChange={handleChange} disabled={!!editingId} required />
          <input style={styles.input} name="name" placeholder="Machine Name" value={formData.name} onChange={handleChange} required />
          <select style={styles.input} name="status" value={formData.status} onChange={handleChange}>
            <option value="running">Running</option>
            <option value="idle">Idle</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <input style={styles.input} name="capacity" type="number" min="0" placeholder="Capacity (tons)" value={formData.capacity} onChange={handleChange} required />
          <input style={styles.input} name="operatingHours" type="number" min="0" placeholder="Operating Hours" value={formData.operatingHours} onChange={handleChange} />
          <input style={styles.input} name="downtime" type="number" min="0" placeholder="Downtime (hours)" value={formData.downtime} onChange={handleChange} />
          <button type="submit" style={styles.submitBtn}>{editingId ? 'Update Machine' : 'Save Machine'}</button>
        </form>
      )}

      <Toolbar view={view} />

      <div style={styles.grid}>
        {view.rows.map((m) => (
          <div key={m._id} style={styles.card}>
            <div style={styles.cardHeader}>
              <h3>{m.name}</h3>
              <span>
                {canAdd && <button style={styles.deleteBtn} title="Edit" onClick={() => startEdit(m)}>✏️</button>}
                {canDelete && <button style={styles.deleteBtn} title="Delete" onClick={() => handleDelete(m._id)}>🗑️</button>}
              </span>
            </div>
            <p><strong>ID:</strong> {m.machineId}</p>
            <p><strong>Status:</strong> <span style={styles[m.status]}>{m.status.toUpperCase()}</span></p>
            <p><strong>Capacity:</strong> {m.capacity} tons</p>
            <p><strong>Operating Hours:</strong> {m.operatingHours}</p>
            <p><strong>Downtime:</strong> {m.downtime} hrs</p>
          </div>
        ))}
      </div>
      <Pager view={view} />
    </div>
  );
}

const styles = {
  ...commonStyles,
  running: { color: '#16a34a', fontWeight: 'bold' },
  idle: { color: '#ca8a04', fontWeight: 'bold' },
  maintenance: { color: '#dc2626', fontWeight: 'bold' }
};

export default Machines;