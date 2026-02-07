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
  // Convert km to miles (1 km = 0.621371 mi)
  const miles = Math.round(km * 0.621371);
  return `${formatNumber(miles)} mi`;
}
