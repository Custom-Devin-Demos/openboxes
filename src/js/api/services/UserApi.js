import {
  USER_BY_ID,
  USER_CHANGE_PASSWORD,
  USER_CREATE,
  USER_LOCALE_OPTIONS,
  USER_LOCATION_ROLE_BY_ID,
  USER_LOCATION_ROLES,
  USER_LOGIN_LOCATION_OPTIONS,
  USER_PHOTO,
  USER_ROLE_OPTIONS,
  USER_SEND_TEST_EMAIL,
  USER_TIMEZONE_OPTIONS,
  USER_TOGGLE_ACTIVATION,
} from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getUser: (id) => apiClient.get(USER_BY_ID(id)),
  getLocaleOptions: () => apiClient.get(USER_LOCALE_OPTIONS),
  getLoginLocationOptions: () => apiClient.get(USER_LOGIN_LOCATION_OPTIONS),
  getTimezoneOptions: () => apiClient.get(USER_TIMEZONE_OPTIONS),
  getRoleOptions: () => apiClient.get(USER_ROLE_OPTIONS),
  createUser: (payload) => apiClient.post(USER_CREATE, payload),
  updateUser: (id, payload) => apiClient.put(USER_BY_ID(id), payload),
  deleteUser: (id) => apiClient.delete(USER_BY_ID(id)),
  changePassword: (id, payload) => apiClient.post(USER_CHANGE_PASSWORD(id), payload),
  toggleActivation: (id) => apiClient.post(USER_TOGGLE_ACTIVATION(id)),
  sendTestEmail: (id) => apiClient.post(USER_SEND_TEST_EMAIL(id)),
  saveLocationRole: (id, payload) => apiClient.post(USER_LOCATION_ROLES(id), payload),
  deleteLocationRole: (id, locationRoleId) =>
    apiClient.delete(USER_LOCATION_ROLE_BY_ID(id, locationRoleId)),
  uploadPhoto: (id, formData) => apiClient.post(USER_PHOTO(id), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};
