import {
  PERSON_BY_ID,
  PERSONS,
  PERSONS_SEARCH,
} from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  searchPersons: (config) => apiClient.get(PERSONS_SEARCH, config),
  getPerson: (id) => apiClient.get(PERSON_BY_ID(id)),
  createPerson: (payload) => apiClient.post(PERSONS, payload),
  updatePerson: (id, payload) => apiClient.put(PERSON_BY_ID(id), payload),
  deletePerson: (id) => apiClient.delete(PERSON_BY_ID(id)),
};
