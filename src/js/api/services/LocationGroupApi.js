import { LOCATION_GROUP_API, LOCATION_GROUP_BY_ID } from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getLocationGroup: (id) => apiClient.get(LOCATION_GROUP_BY_ID(id)),
  createLocationGroup: (payload) => apiClient.post(LOCATION_GROUP_API, payload),
  updateLocationGroup: (id, payload) => apiClient.put(LOCATION_GROUP_BY_ID(id), payload),
  deleteLocationGroup: (id) => apiClient.delete(LOCATION_GROUP_BY_ID(id)),
};
