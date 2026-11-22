/**
 * Indian Rupee and POS numeric formatting utilities
 */

/**
 * Accurately round to 2 decimal places to prevent floating-point calculation issues
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Accurately round weight to 3 decimal places (grams level precision: 0.001 KG = 1 gram)
 */
export function round3(num: number): number {
  return Math.round((num + Number.EPSILON) * 1000) / 1000;
}

/**
 * Format a number as Indian Currency (₹)
 * e.g. 1500 -> "₹1,500.00"
 */
export function formatCurrency(amount: number, showSymbol = true): string {
  const rounded = round2(amount || 0);
  const parts = rounded.toFixed(2).split('.');
  
  // Format integer part using Indian numbering system (lakhs, crores)
  // Last 3 digits grouped, then every 2 digits
  let integerPart = parts[0];
  const decimalPart = parts[1];

  const isNegative = integerPart.startsWith('-');
  if (isNegative) {
    integerPart = integerPart.substring(1);
  }

  const lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);

  const formattedInteger = otherNumbers !== ''
    ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree;

  const result = (isNegative ? '-' : '') + formattedInteger + '.' + decimalPart;
  return showSymbol ? `₹${result}` : result;
}

/**
 * Format weight in KG with appropriate decimal places (e.g., "1.500 KG" or "0.750 KG")
 */
export function formatWeight(kg: number): string {
  const val = round3(kg || 0);
  return `${val.toFixed(3)} KG`;
}

/**
 * Format weight without unit (e.g., "1.500")
 */
export function formatWeightNumeric(kg: number): string {
  const val = round3(kg || 0);
  // If clean integer or 1-2 decimals, display cleanly or with 2-3 decimals
  return val.toFixed(3);
}

/**
 * Format Date in Indian style (DD/MM/YYYY)
 */
export function formatDate(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format Time in 12-hour AM/PM format (hh:mm A)
 */
export function formatTime(date: Date = new Date()): string {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour should be 12
  const formattedHours = String(hours).padStart(2, '0');
  return `${formattedHours}:${minutes} ${ampm}`;
}

/**
 * Generate unique bill identifier
 */
export function generateBillId(): string {
  return 'bill_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
}

/**
 * Generate formatted sequential Bill Number (e.g. BAC-1001)
 */
export function formatBillNumber(prefix: string, sequence: number): string {
  return `${prefix}${sequence}`;
}
