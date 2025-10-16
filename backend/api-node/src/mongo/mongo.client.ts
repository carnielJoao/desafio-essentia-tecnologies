import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function initMongo() {
  const url = process.env.MONGO_URL || 'mongodb://localhost:27017';
  const dbName = process.env.MONGO_DB || 'techx_audit';

  if (!client) {
    client = new MongoClient(url);
    await client.connect();
    db = client.db(dbName);

    await db.collection('todo_audits').createIndexes([
      { key: { todo_id: 1, at: -1 }, name: 'todo_at_desc' },
      { key: { user_id: 1, at: -1 }, name: 'user_at_desc' },
      { key: { event: 1 }, name: 'event' },
    ]);
  }
}

export function getDb(): Db {
  if (!db) throw new Error('Mongo not initialized. Call initMongo() first.');
  return db;
}
