// ============================================================
// URL API — thin wrappers around our axios instance for the URL endpoints
// ============================================================

import api from './axios';

export const createUrl = (longUrl) => api.post('/api/urls', { longUrl });
export const getUrls = () => api.get('/api/urls');
export const getAnalytics = (shortCode) => api.get(`/api/urls/${shortCode}/analytics`);
