/**
 * Formats a date to a human-readable time ago string
 * @param date Date object or string to format
 * @returns Formatted string (e.g., "2 hours ago", "5 minutes ago")
 */
export function timeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const msPerMinute = 60 * 1000;
  const msPerHour = msPerMinute * 60;
  const msPerDay = msPerHour * 24;
  const msPerWeek = msPerDay * 7;
  const msPerMonth = msPerDay * 30;
  const msPerYear = msPerDay * 365;

  const elapsed = now.getTime() - past.getTime();

  if (elapsed < msPerMinute) {
    const seconds = Math.floor(elapsed / 1000);
    return seconds <= 1 ? 'just now' : `${seconds} seconds ago`;
  } else if (elapsed < msPerHour) {
    const minutes = Math.floor(elapsed / msPerMinute);
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  } else if (elapsed < msPerDay) {
    const hours = Math.floor(elapsed / msPerHour);
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  } else if (elapsed < msPerWeek) {
    const days = Math.floor(elapsed / msPerDay);
    return days === 1 ? 'yesterday' : `${days} days ago`;
  } else if (elapsed < msPerMonth) {
    const weeks = Math.floor(elapsed / msPerWeek);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  } else if (elapsed < msPerYear) {
    const months = Math.floor(elapsed / msPerMonth);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  } else {
    const years = Math.floor(elapsed / msPerYear);
    return years === 1 ? '1 year ago' : `${years} years ago`;
  }
}

/**
 * Formats a number as currency with the specified currency symbol
 * @param value Number to format
 * @param currency Currency symbol/code (default: '$')
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currency: string = '$', decimals: number = 2): string {
  return `${currency}${value.toFixed(decimals).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
}

/**
 * Formats a number with the specified suffix for thousands, millions, etc.
 * @param num Number to format
 * @param digits Number of decimal places (default: 1)
 * @returns Formatted string with suffix (K, M, B, T)
 */
export function formatCompactNumber(num: number, digits: number = 1): string {
  const lookup = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'K' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'B' },
    { value: 1e12, symbol: 'T' },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  const item = lookup
    .slice()
    .reverse()
    .find(function(item) {
      return num >= item.value;
    });
  return item
    ? (num / item.value).toFixed(digits).replace(rx, '$1') + item.symbol
    : '0';
}

/**
 * Formats a blockchain address by showing only the beginning and end
 * @param address The full address string
 * @param startChars Number of characters to show at the start (default: 6)
 * @param endChars Number of characters to show at the end (default: 4)
 * @returns Shortened address with ellipsis
 */
export function shortenAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
}