// Creates the FIRST administrator account.
// Usage (from the server folder):  node seedAdmin.js
// Reads ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD from .env. It does nothing if an admin already exists.
// After it succeeds, delete ADMIN_PASSWORD from .env.
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  const { ADMIN_NAME = 'Administrator', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 characters) in .env first.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log(`An admin already exists (${existingAdmin.email}). Nothing was changed.`);
    } else {
      await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin'
      });
      console.log(`Admin created: ${ADMIN_EMAIL}`);
      console.log('Now remove ADMIN_PASSWORD from your .env file.');
    }
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
