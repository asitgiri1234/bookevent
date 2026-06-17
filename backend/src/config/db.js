import mongoose from "mongoose";

/**
 * Connect to MongoDB using the URI from environment variables.
 * Exits the process on failure so we don't run a server with no database.
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    const conn = await mongoose.connect(uri);
    console.log(`Mongo connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Mongo connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
