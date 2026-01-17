/**
 * Formats a number with thousands separator (space)
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number (e.g., "1 000" or "236 545.50")
 */
export const formatNumber = (value, decimals = 2) => {
  const num = Number(value);
  if (isNaN(num)) return '0';

  const fixed = num.toFixed(decimals);
  const [integerPart, decimalPart] = fixed.split('.');

  // Add space thousands separator
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  // Only include decimals if they're not .00
  const hasDecimals = decimalPart && decimalPart !== '00';
  return hasDecimals ? `${formattedInteger}.${decimalPart}` : formattedInteger;
};

/**
 * Formats a currency amount with thousands separator (no currency symbol)
 * @param {number} value - The amount to format
 * @param {string} currency - Currency code (not used, kept for compatibility)
 * @returns {string} Formatted currency (e.g., "1 000" or "1 000.50")
 */
export const formatCurrency = (value, currency = 'MRU') => {
  return formatNumber(value);
};
