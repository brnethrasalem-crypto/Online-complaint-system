// config/db.js
// Establishes and exports the MongoDB connection using Mongoose.

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/grievance-management";
    const conn = await mongoose.connect(mongoUri, {
      // Modern Mongoose (6+/8+) no longer needs useNewUrlParser/useUnifiedTopology,
      // but kept here as explicit intent for readability/backward compatibility.
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on("error", (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected. Attempting reconnect...");
    });
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    console.warn("⚠️  Continuing without a database connection. API routes that require MongoDB will fail until MongoDB is available.");
  }
};

module.exports = connectDB;