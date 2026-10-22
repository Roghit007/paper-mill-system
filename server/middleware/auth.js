const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the JWT sent in the "Authorization: Bearer <token>" header
// and attaches the logged-in user (without password) to req.user.
exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authenticated. Please log in.' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Role is read from the database on every request, so a deleted user
    // or a changed role takes effect immediately.
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Session expired or invalid token. Please log in again.' });
  }
};

// Allows only the listed roles, e.g. authorize('admin', 'operator')
exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied. Your role (${req.user ? req.user.role : 'unknown'}) cannot perform this action.`
    });
  }
  next();
};
