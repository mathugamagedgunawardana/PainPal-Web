import mongoose from 'mongoose';

interface Connection {
  isConnected?: number;
}

const connection: Connection = {};

async function dbConnect(): Promise<void> {
  // If already connected, return
  if (connection.isConnected) {
    return;
  }

  try {
    // Get the MongoDB URI from environment variables
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      throw new Error(
        'Please define the MONGODB_URI environment variable inside .env.local'
      );
    }

    // Connect to MongoDB Atlas
    const db = await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });

    connection.isConnected = db.connections[0].readyState;
    
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB Atlas:', error);
    throw new Error('Failed to connect to MongoDB Atlas');
  }
}

export default dbConnect;
