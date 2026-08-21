import {
  LOCALIZATION_BY_ID,
  LOCALIZATION_DETAILS,
  LOCALIZATION_LOCALE_OPTIONS,
  LOCALIZATION_UPLOAD,
} from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getLocalization: (id) => apiClient.get(LOCALIZATION_DETAILS(id)),
  getLocaleOptions: () => apiClient.get(LOCALIZATION_LOCALE_OPTIONS),
  updateLocalization: (id, payload) => apiClient.put(LOCALIZATION_BY_ID(id), payload),
  deleteLocalization: (id) => apiClient.delete(LOCALIZATION_BY_ID(id)),
  uploadLocalizations: (formData) => apiClient.post(LOCALIZATION_UPLOAD, formData),
};
