import apiClient from './client';

export async function searchDictionary(query, limit = 20) {
  const response = await apiClient.get('/api/public/search', {
    params: {
      q: query,
      type: 'dictionary',
      limit,
    },
  });

  return response.data;
}

export async function getDictionaryDetail(slug) {
  const response = await apiClient.get(`/api/public/dictionary/${encodeURIComponent(slug)}`);
  return response.data;
}
