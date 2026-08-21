import {
  SHIPMENT_ITEM_API,
  SHIPMENT_ITEM_BY_ID,
  SHIPMENT_ITEM_OPTIONS,
  SHIPMENT_ITEM_PICK,
} from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getShipmentItem: (id) => apiClient.get(SHIPMENT_ITEM_BY_ID(id)),
  getShipmentItemOptions: () => apiClient.get(SHIPMENT_ITEM_OPTIONS),
  getShipmentItemPick: (id) => apiClient.get(SHIPMENT_ITEM_PICK(id)),
  updateShipmentItemPick: (id, payload) => apiClient.post(SHIPMENT_ITEM_PICK(id), payload),
  createShipmentItem: (payload) => apiClient.post(SHIPMENT_ITEM_API, payload),
  updateShipmentItem: (id, payload) => apiClient.put(SHIPMENT_ITEM_BY_ID(id), payload),
  deleteShipmentItem: (id) => apiClient.delete(SHIPMENT_ITEM_BY_ID(id)),
};
