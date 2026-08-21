import {
  PARTY_ROLE_API,
  PARTY_ROLE_BY_ID,
  PARTY_ROLE_ROLE_TYPE_OPTIONS,
} from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getPartyRole: (id) => apiClient.get(PARTY_ROLE_BY_ID(id)),
  createPartyRole: (payload) => apiClient.post(PARTY_ROLE_API, payload),
  updatePartyRole: (id, payload) => apiClient.put(PARTY_ROLE_BY_ID(id), payload),
  deletePartyRole: (id) => apiClient.delete(PARTY_ROLE_BY_ID(id)),
  getRoleTypeOptions: () => apiClient.get(PARTY_ROLE_ROLE_TYPE_OPTIONS),
};
