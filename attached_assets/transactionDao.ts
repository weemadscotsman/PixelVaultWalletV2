import { db } from './db';

export async function createTransaction(txData) {
  return db.insert('transactions').values(txData).returning();
}

export async function getTransaction(hash) {
  return db.select().from('transactions').where({ hash }).first();
}

export async function listTransactionsByAddress(address) {
  return db.select().from('transactions').where({ address });
}

export async function updateTransaction(hash, data) {
  return db.update('transactions').set(data).where({ hash }).returning();
}