import axios from 'axios';

// Set at build time (Vite inlines VITE_* vars): changing it requires a rebuild.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// The free Render backend sleeps after ~15 min idle and takes up to ~1 min to wake up.
const api = axios.create({
  baseURL: API_URL,
  timeout: 70000
});

export async function ping() {
  const { data } = await api.get('/ping');
  return data;
}

export default api;
