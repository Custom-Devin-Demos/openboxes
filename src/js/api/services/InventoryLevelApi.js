import {
  INVENTORY_LEVELS_BY_ID,
  INVENTORY_LEVELS_DETAILS,
  INVENTORY_LEVELS_FORM_CONTEXT,
  INVENTORY_LEVELS_FORM_CONTEXT_BY_ID,
  INVENTORY_LEVELS_SAVE,
  INVENTORY_LEVELS_SEARCH,
} from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  search: (config) => apiClient.get(INVENTORY_LEVELS_SEARCH, config),
  getDetails: (id, config) => apiClient.get(INVENTORY_LEVELS_DETAILS(id), config),
  getFormContext: (id, config) => (id
    ? apiClient.get(INVENTORY_LEVELS_FORM_CONTEXT_BY_ID(id), config)
    : apiClient.get(INVENTORY_LEVELS_FORM_CONTEXT, config)),
  create: (data, config) => apiClient.post(INVENTORY_LEVELS_SAVE, data, config),
  update: (id, data, config) => apiClient.post(INVENTORY_LEVELS_BY_ID(id), data, config),
  remove: (id, config) => apiClient.delete(INVENTORY_LEVELS_BY_ID(id), config),
};
