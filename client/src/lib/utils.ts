import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Shortens an address or hash for display purposes
 * @param address The full address or hash to shorten
 * @param start Number of characters to keep at the start
 * @param end Number of characters to keep at the end
 * @returns The shortened address with ellipsis
 */
export function shortenAddress(address: string, start: number = 6, end: number = 6): string {
  if (!address) return '';
  if (address.length <= start + end) return address;
  
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Formats a cryptocurrency amount with proper decimal places
 * @param amount The amount to format
 * @param decimals Number of decimal places to display
 * @param symbol The token symbol to append
 * @returns Formatted amount string
 */
export function formatCryptoAmount(amount: string | number, decimals: number = 6, symbol: string = 'μPVX'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return `0 ${symbol}`;
  
  // For large amounts, use K, M, B
  if (numAmount >= 1_000_000_000) {
    return `${(numAmount / 1_000_000_000).toFixed(2)}B ${symbol}`;
  } else if (numAmount >= 1_000_000) {
    return `${(numAmount / 1_000_000).toFixed(2)}M ${symbol}`;
  } else if (numAmount >= 1_000) {
    return `${(numAmount / 1_000).toFixed(2)}K ${symbol}`;
  }
  
  return `${numAmount.toFixed(decimals)} ${symbol}`;
}

/**
 * Formats a timestamp to a readable time ago string
 * @param timestamp The timestamp to format
 * @returns Formatted time ago string
 */
export function formatTimeAgo(timestamp: number | Date): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}