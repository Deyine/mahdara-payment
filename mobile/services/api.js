const DEV_URL = 'http://localhost:3061/api';
const PROD_URL = 'https://api.bestcar-mr.com/api';

// Force production URL (change to __DEV__ ? DEV_URL : PROD_URL to auto-detect)
const BASE_URL = PROD_URL;

async function request(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

export async function getCatalog(page = 1, perPage = 20) {
  return request('/public/catalog', { page, per_page: perPage });
}

export async function getCar(id) {
  return request(`/public/catalog/${id}`);
}
