/**
 * Formats a number with thousands separator (space)
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number (e.g., "1 000.00" or "236 545.00")
 */
export const formatNumber = (value, decimals = 2) => {
  const num = Number(value);
  if (isNaN(num)) return '0';

  const fixed = num.toFixed(decimals);
  const [integerPart, decimalPart] = fixed.split('.');

  // Add space thousands separator
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
};

/**
 * Formats a currency amount with symbol and thousands separator
 * @param {number} value - The amount to format
 * @param {string} currency - Currency code (EUR, USD, MRU)
 * @returns {string} Formatted currency (e.g., "MRU 1 000.00")
 */
export const formatCurrency = (value, currency = 'MRU') => {
  const formattedValue = formatNumber(value);

  switch (currency) {
    case 'EUR':
      return `€ ${formattedValue}`;
    case 'USD':
      return `$ ${formattedValue}`;
    case 'MRU':
      return `MRU ${formattedValue}`;
    default:
      return `${currency} ${formattedValue}`;
  }
};
