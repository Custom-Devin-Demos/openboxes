import {
  TAG_ADD_PRODUCTS,
  TAG_API,
  TAG_BY_ID,
  TAG_REMOVE_PRODUCTS,
} from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getTag: (id) => apiClient.get(TAG_BY_ID(id)),
  createTag: (payload) => apiClient.post(TAG_API, payload),
  updateTag: (id, payload) => apiClient.put(TAG_BY_ID(id), payload),
  deleteTag: (id) => apiClient.delete(TAG_BY_ID(id)),
  addProducts: (id, payload) => apiClient.post(TAG_ADD_PRODUCTS(id), payload),
  removeProducts: (id, payload) => apiClient.post(TAG_REMOVE_PRODUCTS(id), payload),
};
