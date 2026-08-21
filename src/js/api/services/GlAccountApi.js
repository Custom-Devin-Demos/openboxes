import { GL_ACCOUNT_API, GL_ACCOUNT_BY_ID, GL_ACCOUNT_TYPE_OPTIONS } from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getGlAccount: (id) => apiClient.get(GL_ACCOUNT_BY_ID(id)),
  getGlAccountTypeOptions: () => apiClient.get(GL_ACCOUNT_TYPE_OPTIONS),
  createGlAccount: (payload) => apiClient.post(GL_ACCOUNT_API, payload),
  updateGlAccount: (id, payload) => apiClient.put(GL_ACCOUNT_BY_ID(id), payload),
  deleteGlAccount: (id) => apiClient.delete(GL_ACCOUNT_BY_ID(id)),
};
