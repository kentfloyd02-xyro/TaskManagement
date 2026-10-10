const dns = require('dns');
// Use reliable public DNS resolvers to ensure MongoDB Atlas SRV lookup resolves on local ISPs
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore fallback if already set
}

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_planner');
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Error] Failed to connect to MongoDB: ${error.message}`);
    console.log(`[MongoDB Info] Make sure MongoDB is running or specify a valid MONGODB_URI in your .env file.`);
  }
};

module.exports = connectDB;
