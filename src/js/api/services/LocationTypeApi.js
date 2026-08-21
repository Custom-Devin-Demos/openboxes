import {
  LOCATION_TYPE_API,
  LOCATION_TYPE_BY_ID,
  LOCATION_TYPE_CODE_OPTIONS,
  LOCATION_TYPE_SUPPORTED_ACTIVITY_OPTIONS,
} from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getLocationType: (id) => apiClient.get(LOCATION_TYPE_BY_ID(id)),
  getLocationTypeCodeOptions: () => apiClient.get(LOCATION_TYPE_CODE_OPTIONS),
  getSupportedActivityOptions: () => apiClient.get(LOCATION_TYPE_SUPPORTED_ACTIVITY_OPTIONS),
  createLocationType: (payload) => apiClient.post(LOCATION_TYPE_API, payload),
  updateLocationType: (id, payload) => apiClient.put(LOCATION_TYPE_BY_ID(id), payload),
  deleteLocationType: (id) => apiClient.delete(LOCATION_TYPE_BY_ID(id)),
};
