import { ROLE_BY_ID, ROLE_TYPE_OPTIONS, ROLES } from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getRoleTypeOptions: (config) => apiClient.get(ROLE_TYPE_OPTIONS, config),
  getRole: (id) => apiClient.get(ROLE_BY_ID(id)),
  createRole: (payload) => apiClient.post(ROLES, payload),
  updateRole: (id, payload) => apiClient.put(ROLE_BY_ID(id), payload),
  deleteRole: (id) => apiClient.delete(ROLE_BY_ID(id)),
};
