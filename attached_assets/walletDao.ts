import { db } from './db';

export async function createWallet(params) {
  return db.insert('wallets').values(params).returning();
}

export async function getWallet(address) {
  return db.select().from('wallets').where({ address }).first();
}

export async function updateWallet(address, data) {
  return db.update('wallets').set(data).where({ address }).returning();
}

export async function deleteWallet(address) {
  return db.delete('wallets').where({ address });
}