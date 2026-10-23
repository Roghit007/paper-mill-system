const mongoose = require('mongoose');

let connecting = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (!connecting) {
    connecting = mongoose.connect(process.env.MONGO_URI).then((conn) => {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    }).catch((error) => {
      connecting = null; // allow a retry on the next request
      throw error;
    });
  }
  await connecting;
};

module.exports = connectDB;