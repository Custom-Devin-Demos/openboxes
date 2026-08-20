import { EVENT_TYPE_API, EVENT_TYPE_BY_ID, EVENT_TYPE_EVENT_CODE_OPTIONS } from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getEventType: (id) => apiClient.get(EVENT_TYPE_BY_ID(id)),
  getEventCodeOptions: () => apiClient.get(EVENT_TYPE_EVENT_CODE_OPTIONS),
  createEventType: (payload) => apiClient.post(EVENT_TYPE_API, payload),
  updateEventType: (id, payload) => apiClient.put(EVENT_TYPE_BY_ID(id), payload),
  deleteEventType: (id) => apiClient.delete(EVENT_TYPE_BY_ID(id)),
};
