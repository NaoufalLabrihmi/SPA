// src/lib/api.ts
import axios from 'axios';
import type { AxiosRequestHeaders } from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token && config.url && !config.url.endsWith('/login')) {
    (config.headers as AxiosRequestHeaders)["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export async function login({ username, password }) {
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);
  const res = await axios.post(`${API_BASE_URL}/login`, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return res.data;
}

export async function forgotPassword(email: string) {
  return axios.post(`${API_BASE_URL}/forgot-password`, { email });
}

export async function resetPassword(token: string, password: string) {
  return axios.post(`${API_BASE_URL}/reset-password`, { token, password });
}

export async function getDashboardStats() {
  return axios.get(`${API_BASE_URL}/dashboard-stats`).then(res => res.data);
} 