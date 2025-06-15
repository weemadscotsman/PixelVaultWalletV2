/**
 * Cryptographic utility functions for PVX blockchain
 */

import crypto from 'crypto';

/**
 * Generate a random hash for testing/simulation purposes
 * @returns Random SHA-256 hash string
 */
export function generateRandomHash(): string {
  return crypto.createHash('sha256')
    .update(Math.random().toString() + Date.now().toString())
    .digest('hex');
}

/**
 * Generate a deterministic hash based on input data
 * @param data Data to hash
 * @returns SHA-256 hash string
 */
export function generateHash(data: string): string {
  return crypto.createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * Generate a wallet address from a public key
 * @param publicKey Public key to derive address from
 * @returns PVX wallet address
 */
export function generateWalletAddress(publicKey: string): string {
  const pubKeyHash = crypto.createHash('sha256')
    .update(publicKey)
    .digest('hex');
    
  const addressHash = pubKeyHash.substring(0, 32);
  return `PVX_${addressHash}`;
}

/**
 * Generate a key pair for a new wallet
 * @returns Object containing privateKey and publicKey
 */
export function generateKeyPair(): { privateKey: string, publicKey: string } {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  
  return {
    privateKey,
    publicKey
  };
}

/**
 * Sign data with a private key
 * @param data Data to sign
 * @param privateKey Private key to sign with
 * @returns Digital signature
 */
export function signData(data: string, privateKey: string): string {
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  sign.end();
  return sign.sign(privateKey, 'hex');
}

/**
 * Verify a signature with a public key
 * @param data Data that was signed
 * @param signature Signature to verify
 * @param publicKey Public key to verify with
 * @returns True if signature is valid, false otherwise
 */
export function verifySignature(data: string, signature: string, publicKey: string): boolean {
  const verify = crypto.createVerify('SHA256');
  verify.update(data);
  verify.end();
  
  try {
    return verify.verify(publicKey, signature, 'hex');
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Encrypt data with a public key
 * @param data Data to encrypt
 * @param publicKey Public key to encrypt with
 * @returns Encrypted data
 */
export function encryptWithPublicKey(data: string, publicKey: string): string {
  const buffer = Buffer.from(data, 'utf8');
  const encrypted = crypto.publicEncrypt(publicKey, buffer);
  return encrypted.toString('base64');
}

/**
 * Decrypt data with a private key
 * @param encryptedData Encrypted data to decrypt
 * @param privateKey Private key to decrypt with
 * @returns Decrypted data
 */
export function decryptWithPrivateKey(encryptedData: string, privateKey: string): string {
  const buffer = Buffer.from(encryptedData, 'base64');
  const decrypted = crypto.privateDecrypt(privateKey, buffer);
  return decrypted.toString('utf8');
}

/**
 * Generate a transaction nonce
 * @returns Random nonce for transaction
 */
export function generateNonce(): number {
  return Math.floor(Math.random() * 1000000000);
}

/**
 * Generate a hash for a block based on its contents
 * @param blockData Block data to hash
 * @returns Block hash
 */
export function generateBlockHash(blockData: any): string {
  return crypto.createHash('sha256')
    .update(JSON.stringify(blockData))
    .digest('hex');
}

/**
 * Create a hash for mining simulation
 * @param data Data to hash for mining
 * @param difficulty Mining difficulty (number of leading zeros required)
 * @returns Object with hash and whether it meets the difficulty requirement
 */
export function mineHash(data: string, difficulty: number): { hash: string, meetsTarget: boolean } {
  const hash = generateHash(data);
  const target = '0'.repeat(difficulty);
  const meetsTarget = hash.startsWith(target);
  
  return {
    hash,
    meetsTarget
  };
}

/**
 * Convert string to a buffer for cryptographic operations
 * @param str String to convert
 * @returns Buffer
 */
export function stringToBuffer(str: string): Buffer {
  return Buffer.from(str, 'utf8');
}

/**
 * Convert buffer to a string
 * @param buffer Buffer to convert
 * @returns String
 */
export function bufferToString(buffer: Buffer): string {
  return buffer.toString('utf8');
}

/**
 * Generate a secure random ID
 * @param length Length of the ID
 * @returns Random ID string
 */
export function generateRandomId(length: number = 16): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Encrypts data using AES-256-GCM.
 * @param dataToEncrypt The string data to encrypt.
 * @param key A 32-byte Buffer to be used as the encryption key.
 * @returns An object containing the hex-encoded iv, ciphertext, and authTag.
 */
export function encryptAES256GCM(dataToEncrypt: string, key: Buffer): { iv: string, ciphertext: string, authTag: string } {
  if (key.length !== 32) {
    throw new Error('Encryption key must be 32 bytes for AES-256.');
  }
  const iv = crypto.randomBytes(12); // 96-bit IV is recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let ciphertext = cipher.update(dataToEncrypt, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    iv: iv.toString('hex'),
    ciphertext,
    authTag,
  };
}

/**
 * Decrypts data encrypted with AES-256-GCM.
 * @param ivHex Hex-encoded Initialization Vector.
 * @param ciphertextHex Hex-encoded ciphertext.
 * @param authTagHex Hex-encoded authentication tag.
 * @param key A 32-byte Buffer to be used as the decryption key.
 * @returns The decrypted string data.
 */
export function decryptAES256GCM(ivHex: string, ciphertextHex: string, authTagHex: string, key: Buffer): string {
  if (key.length !== 32) {
    throw new Error('Decryption key must be 32 bytes for AES-256.');
  }
  const ivBuffer = Buffer.from(ivHex, 'hex');
  const ciphertextBuffer = Buffer.from(ciphertextHex, 'hex');
  const authTagBuffer = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, ivBuffer);
  decipher.setAuthTag(authTagBuffer);

  let decrypted = decipher.update(ciphertextBuffer, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}