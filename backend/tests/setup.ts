import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/database';

beforeAll(async () => {
  const testUri = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/healthcare_test';
  await connectDatabase(testUri);
});

afterAll(async () => {
  if (mongoose.connection.db?.databaseName === 'healthcare_test') {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
});
