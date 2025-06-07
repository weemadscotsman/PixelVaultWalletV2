import crypto from 'crypto';

export class DatabaseEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 16;
  private static readonly SALT_LENGTH = 32;
  private static readonly TAG_LENGTH = 16;
  private static readonly KEY_LENGTH = 32;

  private static getEncryptionKey(): string {
    const key = process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET;
    if (!key || key.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters');
    }
    return crypto.createHash('sha256').update(key).digest('hex').slice(0, 64);
  }

  static encryptSensitiveData(data: string): string {
    try {
      const key = Buffer.from(this.getEncryptionKey(), 'hex');
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const salt = crypto.randomBytes(this.SALT_LENGTH);
      
      const cipher = crypto.createCipher(this.ALGORITHM, key);
      cipher.setAAD(salt);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]).toString('base64');
    } catch (error) {
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  static decryptSensitiveData(encryptedData: string): string {
    try {
      const buffer = Buffer.from(encryptedData, 'base64');
      
      const salt = buffer.slice(0, this.SALT_LENGTH);
      const iv = buffer.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
      const tag = buffer.slice(this.SALT_LENGTH + this.IV_LENGTH, this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH);
      const encrypted = buffer.slice(this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH);
      
      const key = Buffer.from(this.getEncryptionKey(), 'hex');
      const decipher = crypto.createDecipher(this.ALGORITHM, key);
      decipher.setAAD(salt);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  static hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const passwordSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, passwordSalt, 10000, 64, 'sha512').toString('hex');
    return { hash, salt: passwordSalt };
  }

  static verifyPassword(password: string, hash: string, salt: string): boolean {
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash));
  }

  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  static createHMAC(data: string, secret?: string): string {
    const hmacSecret = secret || this.getEncryptionKey();
    return crypto.createHmac('sha256', hmacSecret).update(data).digest('hex');
  }

  static verifyHMAC(data: string, signature: string, secret?: string): boolean {
    const expectedSignature = this.createHMAC(data, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }
}