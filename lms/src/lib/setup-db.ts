import { connectToDatabase } from './db';

/**
 * Sets up necessary database indexes and configurations
 */
export async function setupDatabase() {
  try {
    const { db } = await connectToDatabase();
    
    // Create indexes for the bills collection
    await db.collection('bills').createIndex({ createdAt: -1 });
    await db.collection('bills').createIndex({ dateTime: 1 });
    await db.collection('bills').createIndex({ serialNumber: 1 });
    
    console.log('Database indexes created successfully');
    return true;
  } catch (error) {
    console.error('Error setting up database:', error);
    return false;
  }
}
