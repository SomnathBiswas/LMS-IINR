import clientPromise from './mongodb';
import { Db } from 'mongodb';

// Helper function to connect to the database
export async function connectToDatabase(): Promise<{ db: Db }> {
  const client = await clientPromise;
  const db = client.db('lms'); // Use your database name here
  return { db };
}
