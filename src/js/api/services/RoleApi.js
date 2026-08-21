import { ROLE_TYPE_OPTIONS, ROLES } from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getRoleTypeOptions: (config) => apiClient.get(ROLE_TYPE_OPTIONS, config),
  createRole: (payload) => apiClient.post(ROLES, payload),
};
