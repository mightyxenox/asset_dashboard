const BASE_URL = 'http://asset-dashboard-bcnv.onrender.com';

export const fetchWithAuth = async (path, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(BASE_URL + path, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API error: ${response.status} ${response.statusText}`, errorText);
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
};
