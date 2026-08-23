import mongoose from 'mongoose';
import dns from 'dns';
import { env } from './env';
import { logger } from '../utils/logger';

// Ensure public DNS resolver for MongoDB Atlas SRV lookups on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Ignore if running in environments with fixed DNS policies
}

export async function connectDatabase(uri?: string): Promise<typeof mongoose> {
  const primaryUri = uri || env.MONGODB_URI;
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 5000 });
    logger.info(`MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error: any) {
    logger.warn(`Could not connect to primary MongoDB URI (${error.message}). Attempting fallback to local MongoDB...`);
    try {
      const fallbackConn = await mongoose.connect('mongodb://localhost:27017/healthcare', { serverSelectionTimeoutMS: 3000 });
      logger.info(`MongoDB connected to local fallback: ${fallbackConn.connection.host}/${fallbackConn.connection.name}`);
      return fallbackConn;
    } catch (fallbackError: any) {
      logger.error('Failed to connect to both primary and fallback MongoDB', fallbackError);
      if (env.NODE_ENV !== 'test') {
        process.exit(1);
      }
      throw error;
    }
  }
}
