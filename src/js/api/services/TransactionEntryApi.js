import {
  TRANSACTION_ENTRY_API,
  TRANSACTION_ENTRY_BIN_LOCATION_OPTIONS,
  TRANSACTION_ENTRY_BY_ID,
  TRANSACTION_ENTRY_INVENTORY_ITEM_OPTIONS,
  TRANSACTION_ENTRY_TRANSACTION_OPTIONS,
} from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getTransactionEntry: (id) => apiClient.get(TRANSACTION_ENTRY_BY_ID(id)),
  createTransactionEntry: (payload) => apiClient.post(TRANSACTION_ENTRY_API, payload),
  updateTransactionEntry: (id, payload) => apiClient.put(TRANSACTION_ENTRY_BY_ID(id), payload),
  deleteTransactionEntry: (id) => apiClient.delete(TRANSACTION_ENTRY_BY_ID(id)),
  getInventoryItemOptions: () => apiClient.get(TRANSACTION_ENTRY_INVENTORY_ITEM_OPTIONS),
  getTransactionOptions: () => apiClient.get(TRANSACTION_ENTRY_TRANSACTION_OPTIONS),
  getBinLocationOptions: () => apiClient.get(TRANSACTION_ENTRY_BIN_LOCATION_OPTIONS),
};
