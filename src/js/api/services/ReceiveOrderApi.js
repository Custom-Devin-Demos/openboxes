import {
  RECEIVE_ORDER_BY_ID,
  RECEIVE_ORDER_SUBMIT,
  RECEIVE_ORDER_VALIDATE_ORDER_ITEMS,
  RECEIVE_ORDER_VALIDATE_SHIPMENT_DETAILS,
} from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getReceiveOrder: (id) => apiClient.get(RECEIVE_ORDER_BY_ID(id)),
  validateShipmentDetails: (id, payload) =>
    apiClient.post(RECEIVE_ORDER_VALIDATE_SHIPMENT_DETAILS(id), payload),
  validateOrderItems: (id, payload) =>
    apiClient.post(RECEIVE_ORDER_VALIDATE_ORDER_ITEMS(id), payload),
  submit: (id, payload) => apiClient.post(RECEIVE_ORDER_SUBMIT(id), payload),
};
