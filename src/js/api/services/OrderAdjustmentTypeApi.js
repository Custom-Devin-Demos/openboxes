import {
  ORDER_ADJUSTMENT_TYPE_API,
  ORDER_ADJUSTMENT_TYPE_BY_ID,
  ORDER_ADJUSTMENT_TYPE_FORM_DATA,
} from 'api/urls';
import apiClient from 'utils/apiClient';

export default {
  getOrderAdjustmentType: (id) => apiClient.get(ORDER_ADJUSTMENT_TYPE_BY_ID(id)),
  getFormData: () => apiClient.get(ORDER_ADJUSTMENT_TYPE_FORM_DATA),
  createOrderAdjustmentType: (payload) => apiClient.post(ORDER_ADJUSTMENT_TYPE_API, payload),
  updateOrderAdjustmentType: (id, payload) =>
    apiClient.put(ORDER_ADJUSTMENT_TYPE_BY_ID(id), payload),
  deleteOrderAdjustmentType: (id) => apiClient.delete(ORDER_ADJUSTMENT_TYPE_BY_ID(id)),
};
