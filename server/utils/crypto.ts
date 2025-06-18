import { pbkdf2Sync, randomBytes, createCipheriv, createDecipheriv } from "crypto";

export function deriveAESKeyFromPassphrase(passphrase: string) {
  const salt = randomBytes(16);
  const key = pbkdf2Sync(passphrase, salt, 10000, 32, "sha256");
  return { key, salt: salt.toString("hex") }; // salt is returned as hex string
}

export function encryptWithAES(data: string, key: Buffer) { // data is string (e.g., PEM private key)
  const iv = randomBytes(12); // AES-GCM recommended IV size is 12 bytes
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag(); // Get authentication tag
  // Store IV and tag along with encrypted data, common practice is IV:TAG:ENCRYPTED_DATA
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptWithAES(encryptedData: string, key: Buffer): string | null {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) throw new Error("Invalid encrypted data format. Expected IV:TAG:DATA");
    
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = Buffer.from(parts[2], 'hex');

    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag); // Set the authentication tag

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
}
