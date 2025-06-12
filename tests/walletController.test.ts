/// <reference types="jest" />
// Mock walletDao with in-memory store
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

// Mock transaction engine and transaction DAO
jest.mock('../server/transaction-engine', () => ({
  commitTransaction: jest.fn(() => Promise.resolve())
}));

jest.mock('../server/database/transactionDao', () => ({
  transactionDao: {
    createTransaction: jest.fn(async (tx: any) => tx),
    getTransactionsByAddress: jest.fn(async () => [])
  }
}));

import request from 'supertest';
import express from 'express';
import walletRouter from '../server/routes/wallet';
import { memBlockchainStorage } from '../server/mem-blockchain';
import * as passphraseUtils from '../server/utils/passphrase';

const walletsDb: Map<string, any> = (global as any).walletsDb;

const app = express();
app.use(express.json());
app.use('/api/wallet', walletRouter);

beforeEach(() => {
  walletsDb.clear();
  memBlockchainStorage.wallets.clear();

  const genesisWallet = {
    address: 'PVX_1295b5490224b2eb64e9724dc091795a',
    publicKey: 'GENESIS_PUB',
    balance: '1000',
    createdAt: new Date(),
    lastUpdated: new Date(),
    passphraseSalt: 'genesis_salt',
    passphraseHash: 'genesis_hash'
  };
  walletsDb.set(genesisWallet.address, { ...genesisWallet });
  memBlockchainStorage.wallets.set(genesisWallet.address, { ...genesisWallet });
});

describe('POST /api/wallet/send', () => {
  it('returns 404 for unknown sender', async () => {
    const res = await request(app)
      .post('/api/wallet/send')
      .send({ from: 'PVX_unknown', to: 'PVX_other', amount: 10, passphrase: 'x' });
    expect(res.status).toBe(404);
  });

  it('returns 400 for insufficient funds', async () => {
    const salt = passphraseUtils.generateSalt();
    const hash = passphraseUtils.hashPassphrase('secret', salt);
    const sender = {
      address: 'PVX_sender1',
      publicKey: 'PUB1',
      balance: '5',
      createdAt: new Date(),
      lastUpdated: new Date(),
      passphraseSalt: salt,
      passphraseHash: hash
    };
    walletsDb.set(sender.address, { ...sender });
    memBlockchainStorage.wallets.set(sender.address, { ...sender });

    const recipient = {
      address: 'PVX_recipient1',
      publicKey: 'PUB2',
      balance: '0',
      createdAt: new Date(),
      lastUpdated: new Date(),
      passphraseSalt: 's',
      passphraseHash: 'h'
    };
    walletsDb.set(recipient.address, { ...recipient });
    memBlockchainStorage.wallets.set(recipient.address, { ...recipient });

    const res = await request(app)
      .post('/api/wallet/send')
      .send({ from: sender.address, to: recipient.address, amount: 10, passphrase: 'secret' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid JSON payload', async () => {
    const res = await request(app)
      .post('/api/wallet/send')
      .set('Content-Type', 'application/json')
      .send('{');
    expect(res.status).toBe(400);
  });
});

