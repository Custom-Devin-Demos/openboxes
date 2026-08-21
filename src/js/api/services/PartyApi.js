import {
  PARTY_API,
  PARTY_BY_ID,
  PARTY_OPTIONS,
  PARTY_TYPE_OPTIONS,
} from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getParty: (id) => apiClient.get(PARTY_BY_ID(id)),
  createParty: (payload) => apiClient.post(PARTY_API, payload),
  updateParty: (id, payload) => apiClient.put(PARTY_BY_ID(id), payload),
  deleteParty: (id) => apiClient.delete(PARTY_BY_ID(id)),
  getPartyTypeOptions: () => apiClient.get(PARTY_TYPE_OPTIONS),
  getPartyOptions: () => apiClient.get(PARTY_OPTIONS),
};
