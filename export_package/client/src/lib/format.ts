/**
 * Formats a token amount for display, considering decimals
 * @param amount The token amount as a string
 * @param decimals The number of decimals the token has (default: 6)
 * @param displayDecimals Number of decimal places to show (default: 4)
 */
export function formatTokenAmount(
  amount: string | number,
  decimals: number = 6,
  displayDecimals: number = 4
): string {
  let amountStr = amount.toString();
  let negative = false;
  
  // Handle negative amounts
  if (amountStr.startsWith('-')) {
    negative = true;
    amountStr = amountStr.substring(1);
  }
  
  // Pad with leading zeros if needed
  while (amountStr.length <= decimals) {
    amountStr = '0' + amountStr;
  }
  
  // Split at the decimal point
  const integerPart = amountStr.slice(0, amountStr.length - decimals) || '0';
  let fractionalPart = amountStr.slice(amountStr.length - decimals);
  
  // Truncate fractional part to desired display precision
  fractionalPart = fractionalPart.slice(0, displayDecimals);
  
  // Remove trailing zeros
  while (fractionalPart.endsWith('0') && fractionalPart.length > 0) {
    fractionalPart = fractionalPart.slice(0, -1);
  }
  
  // Format with commas for thousands
  const integerWithCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  const result = fractionalPart.length > 0
    ? `${integerWithCommas}.${fractionalPart}`
    : integerWithCommas;
    
  return negative ? `-${result}` : result;
}

/**
 * Formats a number as a percentage
 * @param value The percentage value (e.g., 0.05 for 5%)
 * @param decimals Number of decimal places to show (default: 2)
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return (value * 100).toFixed(decimals) + '%';
}

/**
 * Formats a date to a readable string
 * @param date The date to format
 * @param includeTime Whether to include the time (default: false)
 */
export function formatDate(date: Date, includeTime: boolean = false): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
  };
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Shortens an address for display
 * @param address The full address
 * @param prefixLength The number of characters to show at the start (default: 6)
 * @param suffixLength The number of characters to show at the end (default: 4)
 */
export function shortenAddress(
  address: string,
  prefixLength: number = 6,
  suffixLength: number = 4
): string {
  if (!address) return '';
  if (address.length <= prefixLength + suffixLength) return address;
  
  return `${address.substring(0, prefixLength)}...${address.substring(address.length - suffixLength)}`;
}

/**
 * Formats a large number with abbreviations (K, M, B, T)
 * @param num The number to format
 * @param decimals Number of decimal places (default: 2)
 */
export function formatLargeNumber(num: number, decimals: number = 2): string {
  if (num < 1000) return num.toString();
  
  const abbreviations = ['', 'K', 'M', 'B', 'T'];
  const tier = Math.floor(Math.log10(num) / 3);
  
  if (tier >= abbreviations.length) {
    return num.toExponential(decimals);
  }
  
  const scaled = num / Math.pow(1000, tier);
  return scaled.toFixed(decimals) + abbreviations[tier];
}