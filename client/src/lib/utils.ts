import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Time units in seconds
  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;
  
  if (seconds < minute) {
    return `${seconds} seconds ago`;
  } else if (seconds < hour) {
    const minutes = Math.floor(seconds / minute);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (seconds < day) {
    const hours = Math.floor(seconds / hour);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (seconds < week) {
    const days = Math.floor(seconds / day);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else if (seconds < month) {
    const weeks = Math.floor(seconds / week);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (seconds < year) {
    const months = Math.floor(seconds / month);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    const years = Math.floor(seconds / year);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
}

export function formatNumber(amount: string | number): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0.00';
  }
  
  // Format large numbers with K, M, etc.
  if (numAmount >= 1000000000) {
    return (numAmount / 1000000000).toFixed(1) + 'B';
  } else if (numAmount >= 1000000) {
    return (numAmount / 1000000).toFixed(1) + 'M';
  } else if (numAmount >= 1000) {
    return (numAmount / 1000).toFixed(1) + 'K';
  }
  
  return numAmount.toLocaleString();
}

export function formatCryptoAmount(amount: string | number): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0.00';
  }
  
  // Format large numbers with K, M, etc.
  if (numAmount >= 1_000_000_000) {
    return `${(numAmount / 1_000_000_000).toFixed(2)}B`;
  } else if (numAmount >= 1_000_000) {
    return `${(numAmount / 1_000_000).toFixed(2)}M`;
  } else if (numAmount >= 1_000) {
    return `${(numAmount / 1_000).toFixed(2)}K`;
  } else if (numAmount < 0.000001) {
    return numAmount.toFixed(8);
  } else {
    return numAmount.toFixed(6);
  }
}

export function shortenAddress(address: string): string {
  if (!address) return '';
  
  if (address.length <= 12) return address;
  
  const prefix = address.slice(0, 6);
  const suffix = address.slice(-4);
  
  return `${prefix}...${suffix}`;
}