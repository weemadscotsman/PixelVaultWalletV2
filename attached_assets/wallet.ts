import * as walletDao from './walletDao';

export async function createWallet(params) {
  return walletDao.createWallet(params);
}

export async function getWallet(address) {
  return walletDao.getWallet(address);
}

export async function updateWallet(address, data) {
  return walletDao.updateWallet(address, data);
}

export async function deleteWallet(address) {
  return walletDao.deleteWallet(address);
}