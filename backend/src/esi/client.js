import axios from 'axios';

const ESI_BASE = 'https://esi.evetech.net/latest';
const CONTACT = process.env.ESI_CONTACT_EMAIL || 'unknown@example.com';

export const esi = axios.create({
  baseURL: ESI_BASE,
  timeout: 15000,
  headers: {
    'User-Agent': `eve-tracker (local personal tool; contact: ${CONTACT})`,
  },
});

esi.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    if (status === 420) {
      console.error('ESI error limit hit, backing off');
    }
    return Promise.reject(err);
  }
);

export function authHeader(accessToken) {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
}
