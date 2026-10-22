import React, { useState, useEffect } from 'react';
import api from '../services/api';
import commonStyles from '../styles/common';
import { useAuth } from '../context/AuthContext';
import useListView from '../utils/useListView';
import { Toolbar, Pager } from '../components/ListTools';

const EMPTY = { machineId: '', type: 'Preventive', scheduledDate: '', technician: '', status: 'scheduled', description: '' };
const KEYS = ['machineId', 'type', 'technician', 'status', 'description'];
const errMsg = (e) => e.response?.data?.message || e.message;

function Maintenance() {
  const { can } = useAuth();
  const canAdd = can('maintenance', 'write');
  const canDelete = can('maintenance', 'delete');

  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY);
  const view = useListView(records, KEYS, 'scheduledDate');

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    try {
      const res = await api.get('/maintenance');
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
    setFormData({
      machineId: r.machineId, type: r.type, scheduledDate: String(r.scheduledDate).slice(0, 10),
      technician: r.technician, status: r.status, description: r.description || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await api.put(`/maintenance/${editingId}`, formData);
      else await api.post('/maintenance', formData);
      setFormData(EMPTY); setEditingId(null); setShowForm(false);
      fetchRecords();
    } catch (error) { alert('Error: ' + errMsg(error)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await api.delete(`/maintenance/${id}`);
      fetchRecords();
    } catch (error) { alert('Error: ' + errMsg(error)); }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.heading}>Maintenance Scheduling</h1>
        {canAdd && (
          <button style={styles.addBtn} onClick={toggleForm}>
            {showForm ? 'Cancel' : '+ Schedule Maintenance'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <input style={styles.input} name="machineId" placeholder="Machine ID (e.g. PM-001)" value={formData.machineId} onChange={handleChange} required />
          <select style={styles.input} name="type" value={formData.type} onChange={handleChange}>
            <option value="Preventive">Preventive</option>
            <option value="Breakdown">Breakdown</option>
          </select>
          <input style={styles.input} name="scheduledDate" type="date" value={formData.scheduledDate} onChange={handleChange} required />
          <input style={styles.input} name="technician" placeholder="Technician Name" value={formData.technician} onChange={handleChange} required />
          <select style={styles.input} name="status" value={formData.status} onChange={handleChange}>
            <option value="scheduled">Scheduled</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <input style={styles.input} name="description" placeholder="Description" value={formData.description} onChange={handleChange} />
          <button type="submit" style={styles.submitBtn}>{editingId ? 'Update Schedule' : 'Save Schedule'}</button>
        </form>
      )}

      <Toolbar view={view} dates />

      <table style={styles.table}>
        <thead>
          <tr style={styles.tableHeader}>
            <th style={styles.th}>Machine</th>
            <th style={styles.th}>Type</th>
            <th style={styles.th}>Scheduled Date</th>
            <th style={styles.th}>Technician</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Description</th>
            {(canAdd || canDelete) && <th style={styles.th}>Action</th>}
          </tr>
        </thead>
        <tbody>
          {view.rows.map((r) => (
            <tr key={r._id} style={styles.tr}>
              <td style={styles.td}>{r.machineId}</td>
              <td style={styles.td}>{r.type}</td>
              <td style={styles.td}>{new Date(r.scheduledDate).toLocaleDateString('en-GB')}</td>
              <td style={styles.td}>{r.technician}</td>
              <td style={styles.td}><span style={styles[r.status]}>{r.status.toUpperCase()}</span></td>
              <td style={styles.td}>{r.description || '-'}</td>
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
  scheduled: { color: '#ca8a04', fontWeight: 'bold', backgroundColor: '#fef9c3', padding: '4px 10px', borderRadius: '6px' },
  'in-progress': { color: '#2563eb', fontWeight: 'bold', backgroundColor: '#dbeafe', padding: '4px 10px', borderRadius: '6px' },
  completed: { color: '#16a34a', fontWeight: 'bold', backgroundColor: '#dcfce7', padding: '4px 10px', borderRadius: '6px' }
};

export default Maintenance;