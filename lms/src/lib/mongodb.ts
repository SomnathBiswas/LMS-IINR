import { MongoClient } from 'mongodb';

// Check if MongoDB URI is provided
if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;

// Configure MongoDB connection options
const options = {
  serverSelectionTimeoutMS: 30000, // Reduced from 60s to 30s
  connectTimeoutMS: 10000,        // Reduced from 60s to 10s
  socketTimeoutMS: 45000,         // Reduced from 60s to 45s
  maxPoolSize: 10,                // Add connection pooling
  minPoolSize: 5,                 // Maintain minimum connections
  maxIdleTimeMS: 30000,           // Close idle connections after 30s
  // SSL/TLS options are handled by the connection string
  // Do not use directConnection with SRV URIs
} as const;

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    try {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;