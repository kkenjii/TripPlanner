import axios from 'axios';

const API_KEY = process.env.DOORKEEPER_API_KEY;
const BASE_URL = 'https://api.doorkeeper.jp';

export async function fetchDoorkeeperEvents(city: string) {
  if (!API_KEY) throw new Error('Missing Doorkeeper API key');
  const res = await axios.get(`${BASE_URL}/events`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
    params: { q: city },
  });
  return res.data;
}
