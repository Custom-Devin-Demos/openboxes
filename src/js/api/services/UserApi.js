import {
  USER_BY_ID, USER_CREATE, USER_LOCALE_OPTIONS, USER_PHOTO,
} from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getUser: (id) => apiClient.get(USER_BY_ID(id)),
  getLocaleOptions: () => apiClient.get(USER_LOCALE_OPTIONS),
  createUser: (payload) => apiClient.post(USER_CREATE, payload),
  uploadPhoto: (id, formData) => apiClient.post(USER_PHOTO(id), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};
