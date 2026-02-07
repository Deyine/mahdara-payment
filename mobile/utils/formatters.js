export function formatPrice(amount) {
  if (amount == null) return '—';
  return `${formatNumber(amount)} MRU`;
}

export function formatNumber(num) {
  if (num == null) return '—';
  return Number(num).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function formatMileage(km) {
  if (km == null) return '—';
  return `${formatNumber(km)} km`;
}
