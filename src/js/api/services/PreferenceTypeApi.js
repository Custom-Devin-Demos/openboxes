import {
  PREFERENCE_TYPE_API,
  PREFERENCE_TYPE_BY_ID,
  PREFERENCE_TYPE_VALIDATION_CODE_OPTIONS,
} from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getPreferenceType: (id) => apiClient.get(PREFERENCE_TYPE_BY_ID(id)),
  getValidationCodeOptions: () => apiClient.get(PREFERENCE_TYPE_VALIDATION_CODE_OPTIONS),
  createPreferenceType: (payload) => apiClient.post(PREFERENCE_TYPE_API, payload),
  updatePreferenceType: (id, payload) => apiClient.put(PREFERENCE_TYPE_BY_ID(id), payload),
  deletePreferenceType: (id) => apiClient.delete(PREFERENCE_TYPE_BY_ID(id)),
};
