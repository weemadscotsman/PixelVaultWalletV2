/// <reference types="jest" />
// Mock walletDao with in-memory DB
jest.mock('../server/database/walletDao', () => {
  const walletsDb = new Map<string, any>();
  (global as any).walletsDb = walletsDb;
  return {
    walletDao: {
      createWallet: jest.fn(async (w: any) => { walletsDb.set(w.address, { ...w }); return w; }),
      getWalletByAddress: jest.fn(async (addr: string) => walletsDb.get(addr)),
      updateWallet: jest.fn(async (w: any) => { walletsDb.set(w.address, { ...w }); return w; }),
      updateWalletBalance: jest.fn(async (addr: string, bal: string) => {
        const w = walletsDb.get(addr);
        if (w) { w.balance = bal; walletsDb.set(addr, w); }
        return w;
      })
    }
  };
});

// Mock transaction DAO
jest.mock('../server/database/transactionDao', () => ({
  transactionDao: {
    createTransaction: jest.fn(async (tx: any) => tx),
    getTransactionsByAddress: jest.fn(async () => [])
  }
}));

import { transactionEngine } from '../server/services/transaction-engine';
import { memBlockchainStorage } from '../server/mem-blockchain';

const walletsDb: Map<string, any> = (global as any).walletsDb;

beforeEach(() => {
  walletsDb.clear();
  memBlockchainStorage.wallets.clear();
});

test('createTransferTransaction updates balances', async () => {
  const sender = {
    address: 'PVX_sender2',
    publicKey: 'PUBS',
    balance: '100',
    createdAt: new Date(),
    lastUpdated: new Date(),
    passphraseSalt: 's1',
    passphraseHash: 'h1'
  };
  const recipient = {
    address: 'PVX_recipient2',
    publicKey: 'PUBR',
    balance: '0',
    createdAt: new Date(),
    lastUpdated: new Date(),
    passphraseSalt: 's2',
    passphraseHash: 'h2'
  };
  walletsDb.set(sender.address, { ...sender });
  walletsDb.set(recipient.address, { ...recipient });
  memBlockchainStorage.wallets.set(sender.address, { ...sender });
  memBlockchainStorage.wallets.set(recipient.address, { ...recipient });

  await transactionEngine.createTransferTransaction(sender.address, recipient.address, 40);

  expect(walletsDb.get(sender.address)?.balance).toBe('60');
  expect(walletsDb.get(recipient.address)?.balance).toBe('40');

  const memSender = await memBlockchainStorage.getWalletByAddress(sender.address);
  const memRecipient = await memBlockchainStorage.getWalletByAddress(recipient.address);
  expect(memSender?.balance).toBe('60');
  expect(memRecipient?.balance).toBe('40');
});

