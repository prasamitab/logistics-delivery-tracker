const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("Checking MongoDB environment variables...");
    console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI);
    console.log("MONGO_URI exists:", !!process.env.MONGO_URI);

    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("No Mongo URI found in environment variables");
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;