/// <reference types="jest" />
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

import { walletDao } from '../server/database/walletDao';

const walletsDb: Map<string, any> = (global as any).walletsDb;
import { memBlockchainStorage } from '../server/mem-blockchain';

beforeEach(() => {
  walletsDb.clear();
  memBlockchainStorage.wallets.clear();
});

test('wallet updates stay in sync', async () => {
  const wallet = {
    address: 'PVX_sync',
    publicKey: 'PUB',
    balance: '50',
    createdAt: new Date(),
    lastUpdated: new Date(),
    passphraseSalt: 's',
    passphraseHash: 'h'
  };
  walletsDb.set(wallet.address, { ...wallet });
  memBlockchainStorage.wallets.set(wallet.address, { ...wallet });

  await walletDao.updateWalletBalance(wallet.address, '20');

  const dbWallet = walletsDb.get(wallet.address);
  const memWallet = await memBlockchainStorage.getWalletByAddress(wallet.address);
  expect(memWallet).toEqual(dbWallet);
  expect(memWallet).toMatchSnapshot();
});

