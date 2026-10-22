const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
});

// @desc Login
// POST /api/auth/login   body: { email, password }
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({
      email: String(email).trim().toLowerCase()
    }).select('+password');

    const valid = user && (await user.matchPassword(String(password)));
    if (!valid) {
      // Same message for "no such user" and "wrong password"
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc Get the currently logged-in user
// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
