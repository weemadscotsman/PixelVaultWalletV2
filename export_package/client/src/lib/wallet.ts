import { generateRandomBytes, toHexString, sha3Hash } from "@/lib/crypto";
import { Transaction, TransactionType } from "@/types/blockchain";
import { Wallet, WalletInfo } from "@/types/wallet";

// LocalStorage keys
const WALLET_KEY = "pvx_wallet";
const WALLET_MNEMONIC_KEY = "pvx_wallet_mnemonic";

// Mock base URL - in a real app, this would be configured properly
const API_BASE_URL = "/api";

// Generate a zkSNARK wallet
export async function generateWallet(useMnemonic: boolean = false, entropy?: string): Promise<Wallet> {
  try {
    // This is a simplified version, in a real implementation we would:
    // 1. Use proper cryptography with zkSNARK proofs
    // 2. Generate proper key pairs
    // 3. Use a real implementation of zk proofs for privacy
    
    // Create random seed combining system entropy and user entropy
    const systemEntropy = generateRandomBytes(32);
    const combinedEntropy = entropy 
      ? sha3Hash(systemEntropy + entropy) 
      : sha3Hash(systemEntropy);
    
    // Generate private key from entropy (simplified)
    const privateKey = sha3Hash(combinedEntropy);
    
    // Derive public address (in a real implementation this would use proper cryptography)
    const publicAddress = `zk_PVX:0x${toHexString(sha3Hash(privateKey)).substring(0, 40)}`;
    
    // Generate mnemonic if requested (simplified)
    // In a real implementation, we would use BIP39 to generate proper mnemonic phrases
    let mnemonic = "";
    if (useMnemonic) {
      // Mock mnemonic generation - in a real app, this would use BIP39
      const words = [
        "apple", "banana", "carbon", "device", "email", "forest", 
        "guitar", "hotel", "island", "jungle", "kitchen", "lemon",
        "market", "narrow", "orange", "purple", "quantum", "river", 
        "summer", "tiger", "umbrella", "violet", "window", "xylophone"
      ];
      
      // Generate 12 random words
      mnemonic = Array(12).fill(0).map(() => {
        const randomIndex = Math.floor(Math.random() * words.length);
        return words[randomIndex];
      }).join(" ");
    }
    
    // Create wallet object
    const wallet: Wallet = {
      publicAddress,
      privateKey,
      balance: 0, // Initial balance, will be updated from blockchain
      created: new Date(),
      lastUpdated: new Date()
    };
    
    // Save wallet to local storage
    saveWallet(wallet);
    
    // Save mnemonic separately for extra security
    if (mnemonic) {
      localStorage.setItem(WALLET_MNEMONIC_KEY, mnemonic);
    }
    
    // Create wallet on server
    await createWalletOnServer(wallet.publicAddress);
    
    return wallet;
  } catch (error) {
    console.error("Error generating wallet:", error);
    throw new Error("Failed to generate wallet");
  }
}

// Save wallet to localStorage (except sensitive data like mnemonic)
export function saveWallet(wallet: Wallet): void {
  try {
    localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
  } catch (error) {
    console.error("Error saving wallet:", error);
    throw new Error("Failed to save wallet");
  }
}

// Load wallet from localStorage
export function loadWallet(): Wallet | null {
  try {
    const walletData = localStorage.getItem(WALLET_KEY);
    if (!walletData) return null;
    
    const wallet = JSON.parse(walletData) as Wallet;
    return wallet;
  } catch (error) {
    console.error("Error loading wallet:", error);
    return null;
  }
}

// Get the mnemonic for a wallet
export function getWalletMnemonic(): string | null {
  return localStorage.getItem(WALLET_MNEMONIC_KEY);
}

// Get wallet balance from the blockchain
export async function getWalletBalance(address: string): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/wallet/balance?address=${address}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch balance: ${response.statusText}`);
    }
    const data = await response.json();
    
    // Update local wallet info
    const wallet = loadWallet();
    if (wallet && wallet.publicAddress === address) {
      wallet.balance = data.balance;
      wallet.lastUpdated = new Date();
      saveWallet(wallet);
    }
    
    return data.balance;
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    throw new Error("Failed to fetch wallet balance");
  }
}

// Get wallet information including balance
export async function getWalletInfo(address: string): Promise<WalletInfo> {
  try {
    const balance = await getWalletBalance(address);
    const transactions = await getWalletTransactions(address);
    
    return {
      publicAddress: address,
      balance,
      transactions,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error("Error fetching wallet info:", error);
    throw new Error("Failed to fetch wallet information");
  }
}

// Get wallet transactions
export async function getWalletTransactions(address: string): Promise<Transaction[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/wallet/transactions?address=${address}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    throw new Error("Failed to fetch wallet transactions");
  }
}

// Create a new transaction
export async function createTransaction(
  fromAddress: string, 
  toAddress: string, 
  amount: number,
  privateKey: string,
  note?: string
): Promise<Transaction> {
  try {
    // In a real implementation, we would:
    // 1. Create a transaction object
    // 2. Sign it with the private key
    // 3. Generate zkSNARK proof to preserve privacy
    // 4. Submit to the blockchain network
    
    const transaction = {
      fromAddress,
      toAddress,
      amount,
      note: note || "",
      type: TransactionType.TRANSFER
    };
    
    const response = await fetch(`${API_BASE_URL}/transactions/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(transaction)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create transaction: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw new Error("Failed to create transaction");
  }
}

// Create wallet on server
async function createWalletOnServer(address: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/wallet/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ address })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create wallet on server: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error creating wallet on server:", error);
    throw new Error("Failed to create wallet on server");
  }
}
