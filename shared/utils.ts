import { randomBytes } from 'crypto';

/**
 * Creates a unique ID for database records
 * @returns A unique ID string
 */
export function createId(): string {
  return `${Date.now().toString(16)}_${randomBytes(4).toString('hex')}`;
}

/**
 * Formats a number as a currency string
 * @param amount The amount to format
 * @returns A formatted currency string
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });
}

/**
 * Formats a date as a string
 * @param date The date to format
 * @returns A formatted date string
 */
export function formatDate(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Shortens an address for display
 * @param address The address to shorten
 * @returns A shortened address string
 */
export function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Gets the time elapsed since a given date
 * @param date The date to compare against
 * @returns A string describing the elapsed time
 */
export function getTimeElapsed(date: Date | number): string {
  const now = Date.now();
  const timestamp = typeof date === 'number' ? date : date.getTime();
  const elapsed = now - timestamp;
  
  const seconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
}

/**
 * Calculates the time remaining until a given date
 * @param date The date to compare against
 * @returns A string describing the remaining time
 */
export function getTimeRemaining(date: Date | number): string {
  const now = Date.now();
  const timestamp = typeof date === 'number' ? date : date.getTime();
  const remaining = timestamp - now;
  
  if (remaining <= 0) return 'Expired';
  
  const seconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return `${seconds} second${seconds !== 1 ? 's' : ''}`;
}

/**
 * Checks if a value is a valid number
 * @param value The value to check
 * @returns True if the value is a valid number, false otherwise
 */
export function isValidNumber(value: any): boolean {
  if (value === null || value === undefined || value === '') return false;
  return !isNaN(Number(value));
}

/**
 * Formats a number as a hash rate string
 * @param hashRate The hash rate to format
 * @returns A formatted hash rate string
 */
export function formatHashRate(hashRate: number): string {
  if (hashRate >= 1e9) {
    return `${(hashRate / 1e9).toFixed(2)} GH/s`;
  } else if (hashRate >= 1e6) {
    return `${(hashRate / 1e6).toFixed(2)} MH/s`;
  } else if (hashRate >= 1e3) {
    return `${(hashRate / 1e3).toFixed(2)} KH/s`;
  } else {
    return `${hashRate.toFixed(2)} H/s`;
  }
}

/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes The size in bytes
 * @returns A formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}