const express = require('express');
const User = require('../models/User');
const { ROLES } = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Every route in this file is admin-only
router.use(protect, authorize('admin'));

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

// GET /api/users
router.get('/', async (req, res) => {
  try {
    res.json(await User.find().sort({ createdAt: -1 }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/users   body: { name, email, password, role }
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: `Role must be one of: ${ROLES.join(', ')}` });
    }
    const exists = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (exists) return res.status(409).json({ message: 'A user with this email already exists' });

    const user = await User.create({ name, email, password, role });
    res.status(201).json(publicUser(user));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/users/:id   body: any of { name, email, password, role }
// A blank/missing password keeps the current one.
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, email, password, role } = req.body || {};

    if (role !== undefined && role !== user.role) {
      if (!ROLES.includes(role)) {
        return res.status(400).json({ message: `Role must be one of: ${ROLES.join(', ')}` });
      }
      if (String(user._id) === String(req.user._id)) {
        return res.status(400).json({ message: 'You cannot change your own role' });
      }
      if (user.role === 'admin' && (await User.countDocuments({ role: 'admin' })) <= 1) {
        return res.status(400).json({ message: 'Cannot remove the last admin' });
      }
      user.role = role;
    }

    if (name !== undefined) {
      if (!String(name).trim()) return res.status(400).json({ message: 'Name cannot be empty' });
      user.name = name;
    }

    if (email !== undefined) {
      const newEmail = String(email).trim().toLowerCase();
      if (newEmail !== user.email) {
        const taken = await User.findOne({ email: newEmail, _id: { $ne: user._id } });
        if (taken) return res.status(409).json({ message: 'A user with this email already exists' });
        user.email = newEmail;
      }
    }

    if (password) {
      if (String(password).length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
      }
      user.password = String(password); // hashed automatically on save
    }

    await user.save();
    res.json(publicUser(user));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/users/:id  (cannot delete yourself or the last admin)
router.delete('/:id', async (req, res) => {
  try {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target.role === 'admin' && (await User.countDocuments({ role: 'admin' })) <= 1) {
      return res.status(400).json({ message: 'Cannot delete the last admin' });
    }
    await target.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;