import React, { useState, useEffect } from 'react';
import api from '../services/api';
import commonStyles from '../styles/common';
import { useAuth } from '../context/AuthContext';
import useListView from '../utils/useListView';
import { Toolbar, Pager } from '../components/ListTools';

const EMPTY = { name: '', email: '', password: '', role: 'operator' };
const KEYS = ['name', 'email', 'role'];
const errMsg = (e) => e.response?.data?.message || e.message;

// Admin-only page: create, edit, reset password and remove accounts
function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY);
  const view = useListView(users, KEYS);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (e) { alert('Error: ' + errMsg(e)); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const toggleForm = () => {
    setEditingId(null);
    setFormData(EMPTY);
    setShowForm(!showForm || editingId !== null);
  };

  const startEdit = (u) => {
    setEditingId(u._id);
    setFormData({ name: u.name, email: u.email, password: '', role: u.role });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password; // blank = keep current password
        await api.put(`/users/${editingId}`, payload);
      } else {
        await api.post('/users', formData);
      }
      setFormData(EMPTY); setEditingId(null); setShowForm(false);
      fetchUsers();
    } catch (error) { alert('Error: ' + errMsg(error)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (error) { alert('Error: ' + errMsg(error)); }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.heading}>User Management</h1>
        <button style={styles.addBtn} onClick={toggleForm}>
          {showForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <input style={styles.input} name="name" placeholder="Full name" value={formData.name} onChange={handleChange} required />
          <input style={styles.input} name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          <input
            style={styles.input}
            name="password"
            type="password"
            placeholder={editingId ? 'New password (leave blank to keep current)' : 'Password (min 8 characters)'}
            value={formData.password}
            onChange={handleChange}
            minLength={8}
            required={!editingId}
            autoComplete="new-password"
          />
          <select style={styles.input} name="role" value={formData.role} onChange={handleChange}>
            <option value="operator">Operator</option>
            <option value="inspector">Inspector</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" style={styles.submitBtn}>{editingId ? 'Update User' : 'Create User'}</button>
        </form>
      )}

      <Toolbar view={view} />

      <table style={styles.table}>
        <thead>
          <tr style={styles.tableHeader}>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Role</th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {view.rows.map((u) => (
            <tr key={u._id} style={styles.tr}>
              <td style={styles.td}>{u.name}</td>
              <td style={styles.td}>{u.email}</td>
              <td style={styles.td}>{u.role.toUpperCase()}</td>
              <td style={styles.td}>
                <button style={styles.deleteBtn} title="Edit / reset password" onClick={() => startEdit(u)}>✏️</button>
                {me && u._id !== me.id && (
                  <button style={styles.deleteBtn} title="Delete" onClick={() => handleDelete(u._id)}>🗑️</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pager view={view} />
    </div>
  );
}

const styles = commonStyles;
export default Users;