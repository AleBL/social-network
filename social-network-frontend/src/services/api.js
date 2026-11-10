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

export async function getUsers() {
  const { data } = await api.get('/api/users');
  return data.data;
}

// The API answers 201 without the created user, so callers reload the list.
export async function createUser({ name, email }) {
  await api.post('/api/users', { name, email });
}

const userPath = (id) => encodeURIComponent(id);

export async function getUser(id) {
  const { data } = await api.get(`/api/users/${userPath(id)}`);
  return data.data;
}

export async function listFriends(id) {
  const { data } = await api.get(`/api/users/listFriends/${userPath(id)}`);
  return data.data;
}

export async function recommendFriends(id) {
  const { data } = await api.get(
    `/api/users/recommendFriends/${userPath(id)}`
  );
  return data.data;
}

// Friendships are mutual: the backend links both users.
export async function createFriendship(userId1, userId2) {
  await api.post('/api/users/createFriendship', { userId1, userId2 });
}

// Turns an axios error into a message for the UI. The backend always answers
// errors as { status: 'error', error: '<message>' } (400, 404, 409, 429, 503...).
export function getErrorMessage(error) {
  const serverMessage = error?.response?.data?.error;

  if (serverMessage) {
    return serverMessage;
  }
  if (error?.code === 'ECONNABORTED') {
    return 'The server took too long to answer, please try again';
  }
  return 'Could not reach the server, please try again later';
}

export default api;
