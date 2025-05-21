import * as transactionDao from './transactionDao';
import * as websocket from './websocket';

export async function processTransaction(txData) {
  try {
    const result = await transactionDao.createTransaction(txData);
    websocket.emitTransaction(result);
    return result;
  } catch (err) {
    console.error('Transaction failed:', err);
    throw new Error('TX_ERROR');
  }
}